import { Router, Request, Response } from 'express';
import { getSupabase } from '../services/supabase';
import { getClientDetail } from '../services/client-attendances';
import { normalizePhone } from '../services/evolution';
import { runReminderSweep } from '../services/reminder-cron';

const router = Router();

const PREFS_TABLE = 'notification_preferences';

/** Guard: every route needs Supabase. Returns the client or sends 503. */
function requireSupabase(res: Response) {
  const supabase = getSupabase();
  if (!supabase) {
    res.status(503).json({ error: 'Notifications are not configured (Supabase missing)' });
    return null;
  }
  return supabase;
}

function firstNonEmpty(...values: any[]): string {
  for (const v of values) {
    const s = v != null ? String(v).trim() : '';
    if (s) return s;
  }
  return '';
}

/**
 * POST /api/notifications/preferences
 * Create or update a client's WhatsApp reminder preference (upsert by cliente_id).
 * Body: { cliente_id, phone?, notify_minutes_before?, enabled? }
 * If phone is omitted, it is fetched from the SeuFisio client detail.
 */
router.post('/preferences', async (req: Request, res: Response) => {
  const supabase = requireSupabase(res);
  if (!supabase) return;

  try {
    const { cliente_id, phone, notify_minutes_before, enabled } = req.body || {};
    const clienteId = parseInt(cliente_id, 10);
    if (!clienteId) {
      res.status(400).json({ error: 'cliente_id is required' });
      return;
    }

    // Resolve phone: use provided, else pull from SeuFisio detail.
    let resolvedPhone = phone ? String(phone) : '';
    if (!resolvedPhone) {
      try {
        const detail = await getClientDetail(clienteId);
        resolvedPhone = firstNonEmpty(detail.telefone, detail.telefone_2, detail.celular);
      } catch {
        // ignore — phone stays empty, cron will retry from SeuFisio at send time
      }
    }

    const minutes = notify_minutes_before != null ? parseInt(notify_minutes_before, 10) : 60;
    if (isNaN(minutes) || minutes < 0) {
      res.status(400).json({ error: 'notify_minutes_before must be a non-negative integer' });
      return;
    }

    const row = {
      seufisio_cliente_id: clienteId,
      phone: resolvedPhone ? normalizePhone(resolvedPhone) : null,
      notify_minutes_before: minutes,
      enabled: enabled != null ? Boolean(enabled) : true,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from(PREFS_TABLE)
      .upsert(row, { onConflict: 'seufisio_cliente_id' })
      .select()
      .single();
    if (error) throw error;

    res.json({ success: true, preference: data });
  } catch (error: any) {
    console.error('[Notifications] Upsert error:', error?.message || error);
    res.status(500).json({ error: 'Failed to save preference', details: error?.message });
  }
});

/**
 * GET /api/notifications/preferences/:clienteId
 */
router.get('/preferences/:clienteId', async (req: Request, res: Response) => {
  const supabase = requireSupabase(res);
  if (!supabase) return;

  try {
    const clienteId = parseInt(String(req.params.clienteId), 10);
    const { data, error } = await supabase
      .from(PREFS_TABLE)
      .select('*')
      .eq('seufisio_cliente_id', clienteId)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      res.status(404).json({ error: 'No preference found for this client' });
      return;
    }
    res.json({ preference: data });
  } catch (error: any) {
    console.error('[Notifications] Get error:', error?.message || error);
    res.status(500).json({ error: 'Failed to fetch preference', details: error?.message });
  }
});

/**
 * PUT /api/notifications/preferences/:clienteId
 * Partial update of phone / notify_minutes_before / enabled.
 */
router.put('/preferences/:clienteId', async (req: Request, res: Response) => {
  const supabase = requireSupabase(res);
  if (!supabase) return;

  try {
    const clienteId = parseInt(String(req.params.clienteId), 10);
    const { phone, notify_minutes_before, enabled } = req.body || {};

    const patch: Record<string, any> = { updated_at: new Date().toISOString() };
    if (phone !== undefined) patch.phone = phone ? normalizePhone(String(phone)) : null;
    if (notify_minutes_before !== undefined) {
      const minutes = parseInt(notify_minutes_before, 10);
      if (isNaN(minutes) || minutes < 0) {
        res.status(400).json({ error: 'notify_minutes_before must be a non-negative integer' });
        return;
      }
      patch.notify_minutes_before = minutes;
    }
    if (enabled !== undefined) patch.enabled = Boolean(enabled);

    const { data, error } = await supabase
      .from(PREFS_TABLE)
      .update(patch)
      .eq('seufisio_cliente_id', clienteId)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      res.status(404).json({ error: 'No preference found for this client' });
      return;
    }
    res.json({ success: true, preference: data });
  } catch (error: any) {
    console.error('[Notifications] Update error:', error?.message || error);
    res.status(500).json({ error: 'Failed to update preference', details: error?.message });
  }
});

/**
 * DELETE /api/notifications/preferences/:clienteId
 * Soft-disable (keeps the row, sets enabled=false).
 */
router.delete('/preferences/:clienteId', async (req: Request, res: Response) => {
  const supabase = requireSupabase(res);
  if (!supabase) return;

  try {
    const clienteId = parseInt(String(req.params.clienteId), 10);
    const { data, error } = await supabase
      .from(PREFS_TABLE)
      .update({ enabled: false, updated_at: new Date().toISOString() })
      .eq('seufisio_cliente_id', clienteId)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      res.status(404).json({ error: 'No preference found for this client' });
      return;
    }
    res.json({ success: true, preference: data });
  } catch (error: any) {
    console.error('[Notifications] Delete error:', error?.message || error);
    res.status(500).json({ error: 'Failed to disable preference', details: error?.message });
  }
});

/**
 * POST /api/notifications/run-sweep
 * Manually trigger a reminder sweep (for testing / on-demand). Returns the summary.
 */
router.post('/run-sweep', async (_req: Request, res: Response) => {
  if (!requireSupabase(res)) return;
  try {
    const summary = await runReminderSweep();
    res.json(summary);
  } catch (error: any) {
    console.error('[Notifications] Sweep error:', error?.message || error);
    res.status(500).json({ error: 'Sweep failed', details: error?.message });
  }
});

export default router;
