import { Router, Request, Response } from 'express';
import { seufisioClient } from '../services/seufisio-client';
import { env } from '../config/env';

const router = Router();

/**
 * GET /api/reposicao/client-search?name=<name>
 * Search for a customer by name for reposition flow
 */
router.get('/client-search', async (req: Request, res: Response) => {
  try {
    const name = (req.query.name as string) || '';

    if (!name) {
      res.status(400).json({ error: 'Missing required query parameter: name' });
      return;
    }

    const data = await seufisioClient.get('/api/cliente', {
      page: 1,
      filter: name,
      'filtro_avancado[buscar]': name,
      'filtro_avancado[situacao]': 2,
      'filtro_avancado[telefone]': '',
      'filtro_avancado[tipo_cliente]': '',
      'filtro_avancado[pacote_ativo]': '',
    });

    const clients = (data.data || []).map((client: any) => ({
      id: client.id,
      nome: client.nome,
    }));

    res.json({ clients });
  } catch (error: any) {
    console.error('[Reposição Client Search] Error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to search clients' });
  }
});

/**
 * GET /api/reposicao/count/:clientId
 * Count pending repositions for a client
 */
router.get('/count/:clientId', async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;

    const data = await seufisioClient.get(`/api/cliente/${clientId}/listar-vendas`, {
      tab: 'ativas',
      page: 1,
      per_page: 100,
    });

    const sales = (data.data || []).map((sale: any) => ({
      id: sale.id,
      tipoAtendimentoNome: sale.tipoAtendimentoNome,
      tipoAtendimentoId: sale.tipoAtendimentoId,
      atendimentosRepor: sale.atendimentosRepor || 0,
    }));

    const totalReposicoes = sales.reduce(
      (sum: number, sale: any) => sum + (sale.atendimentosRepor || 0),
      0
    );

    res.json({
      clientId: parseInt(clientId as string),
      totalReposicoes,
      sales,
    });
  } catch (error: any) {
    console.error('[Reposição Count] Error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to count repositions' });
  }
});

/**
 * POST /api/reposicao/create
 * Create a reposition attendance
 *
 * Body: { clientId, date, hour, saleId }
 *
 * Flow:
 * 1. Get sale details (tipo_atendimento_id, pacote_id)
 * 2. Get professionals list
 * 3. For each professional, check availability at requested date/hour
 * 4. Find professional with available slot
 * 5. Get atendimentos to repor (for remarcado_id)
 * 6. Create the atendimento
 */
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { clientId, date, hour, saleId } = req.body;

    if (!clientId || !date || !hour || !saleId) {
      res.status(400).json({
        error: "Missing required fields: clientId, date, hour, saleId",
      });
      return;
    }

    // Step 1: Get sale details
    console.log(
      `[Reposição Create] Getting sale details for client ${clientId}, sale ${saleId}`,
    );
    const salesData = await seufisioClient.get(
      `/api/cliente/${clientId}/listar-vendas`,
      {
        tab: "ativas",
        page: 1,
        per_page: 100,
      },
    );

    const sale = (salesData.data || []).find((s: any) => s.id === saleId);
    if (!sale) {
      res
        .status(404)
        .json({ error: `Sale ${saleId} not found for client ${clientId}` });
      return;
    }

    if ((sale.atendimentosRepor || 0) <= 0) {
      res.status(400).json({ error: "No pending repositions for this sale" });
      return;
    }

    const tipoAtendimentoId = sale.tipoAtendimentoId;
    // For servico_recorrente, use cicloId; for pacote_personalizado, use sale.id
    const cicloId = sale.cicloId;
    const pacoteId = cicloId || sale.id;
    console.log(
      `[Reposição Create] Sale type: ${sale.tipoVenda}, sale.id: ${sale.id}, cicloId: ${cicloId}, using pacoteId: ${pacoteId}`,
    );

    // Step 2: Get professionals
    console.log("[Reposição Create] Getting professionals list");
    const professionals: any[] = await seufisioClient.get(
      "/api/profissional/todos-profissionais",
    );
    const activeProfessionals = professionals.filter((p: any) => p.ativo);

    if (activeProfessionals.length === 0) {
      res.status(500).json({ error: "No active professionals found" });
      return;
    }

    // Step 3: Calculate week range for the requested date
    const requestedDate = new Date(`${date}T00:00:00`);
    const dayOfWeek = requestedDate.getDay();
    const weekStart = new Date(requestedDate);
    weekStart.setDate(requestedDate.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 0);

    const startTimestamp = Math.floor(weekStart.getTime() / 1000);
    const endTimestamp = Math.floor(weekEnd.getTime() / 1000);

    // Step 4: Check availability for each professional
    console.log(
      `[Reposição Create] Checking availability for ${date} at ${hour}`,
    );
    let availableProfessional: any = null;

    for (const prof of activeProfessionals) {
      const events: any[] = await seufisioClient.get("/api/basic-events", {
        profissional_id: prof.id,
        start: startTimestamp,
        end: endTimestamp,
      });

      // Count how many events overlap with the requested hour on the requested date
      const requestedHourStart = `${date} ${hour}:00`;
      const [hourPart, minutePart] = hour.split(":").map(Number);
      const endHour =
        minutePart + 50 >= 60
          ? `${String(hourPart + 1).padStart(2, "0")}:${String(minutePart + 50 - 60).padStart(2, "0")}`
          : `${String(hourPart).padStart(2, "0")}:${String(minutePart + 50).padStart(2, "0")}`;
      const requestedHourEnd = `${date} ${endHour}:00`;

      // Count events that overlap with the requested time slot
      const overlappingEvents = events.filter((event: any) => {
        const eventStart = event.start;
        const eventEnd = event.end;
        // Check if the event overlaps with the requested slot
        return eventStart < requestedHourEnd && eventEnd > requestedHourStart;
      });

      console.log(
        `[Reposição Create] Professional ${prof.nome} (${prof.id}): ${overlappingEvents.length} events at ${date} ${hour}`,
      );

      if (overlappingEvents.length < env.MAX_ATTENDANCES_PER_HOUR) {
        availableProfessional = prof;
        break;
      }
    }

    if (!availableProfessional) {
      res.status(409).json({
        error: `No professional available at ${date} ${hour}. All professionals have reached the maximum of ${env.MAX_ATTENDANCES_PER_HOUR} attendances for this time slot.`,
      });
      return;
    }

    // Step 5: Get atendimentos to repor (for remarcado_id) — REQUIRED
    console.log(
      `[Reposição Create] Getting atendimentos to repor for pacoteId ${pacoteId} (cicloId: ${cicloId}, sale.id: ${sale.id})`,
    );
    let remarcadoId: number | null = null;

    // Try pacoteId first (which is cicloId for servico_recorrente)
    const idsToTry = [sale.id];

    for (const tryId of idsToTry) {
      try {
        console.log(
          `[Reposição Create] Trying get-atendimentos-repor with id: ${tryId}`,
        );
        const atendimentosRepor: any[] = await seufisioClient.get(
          `/api/pacote/${tryId}/get-atendimentos-repor`,
        );

        console.log(
          `[Reposição Create] Response for id ${tryId}: ${JSON.stringify(atendimentosRepor)}`,
        );

        if (atendimentosRepor && atendimentosRepor.length > 0) {
          remarcadoId = atendimentosRepor[0].id;
          console.log(
            `[Reposição Create] Found remarcado_id: ${remarcadoId} using id: ${tryId}`,
          );
          break;
        }
      } catch (err: any) {
        console.log(
          `[Reposição Create] Failed with id ${tryId}:`,
          err?.response?.data || err?.message,
        );
      }
    }

    if (!remarcadoId) {
      res.status(404).json({
        error:
          "Could not find the original attendance for reposition (remarcado_id). The sale reports pending repositions but no original attendance was found.",
        debug: { saleId: sale.id, cicloId, idsTriedForRepor: idsToTry },
      });
      return;
    }

    // Step 6: Calculate end time (50 min sessions)
    const [h, m] = hour.split(":").map(Number);
    const endMinutes = m + 50;
    const finalHour = `${String(h + Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;

    // Step 7: Create the atendimento
    console.log(
      `[Reposição Create] Creating atendimento with professional ${availableProfessional.nome}`,
    );
    const atendimentoData: Record<string, any> = {
      cliente_id: clientId,
      profissional_id: availableProfessional.id,
      data_atendimento: date,
      duracao_atendimento: 50,
      hora_atendimento: hour,
      sala_id: 1,
      tipo_atendimento_id: tipoAtendimentoId,
      status_id: 1,
      remarcado_id: remarcadoId,
      pacote_id: pacoteId,
      is_pacote: pacoteId,
      aula_experimental: false,
      created_by_user_id: 21714,
      hora_final_atendimento: finalHour,
      atualizar_valor_cobranca_ciclo: false,
    };

    console.log(
      `[Reposição Create] Payload: ${JSON.stringify(atendimentoData, null, 2)}`,
    );

    const result = await seufisioClient.post(
      "/api/atendimento",
      atendimentoData,
    );

    console.log(`[Reposição Create] Success! Atendimento ID: ${result.id}`);

    res.json({
      success: true,
      message: `Reposição criada com sucesso para ${date} às ${hour} com ${availableProfessional.nome}`,
      atendimento: {
        id: result.id,
        data: result.data_atendimento,
        hora: result.hora_atendimento,
        horaFinal: result.hora_final_atendimento,
        profissional: availableProfessional.nome,
        status: result.status?.nome || "Aguardando Chegar",
      },
    });
  } catch (error: any) {
    console.error("[Reposição Create] Error status:", error?.response?.status);
    console.error(
      "[Reposição Create] Error data:",
      JSON.stringify(error?.response?.data),
    );
    console.error("[Reposição Create] Error message:", error.message);

    if (error?.response?.data) {
      res.status(error.response.status || 500).json({
        error: 'Failed to create reposition',
        details: error.response.data,
      });
    } else {
      res.status(500).json({ error: 'Failed to create reposition', details: error.message });
    }
  }
});

/**
 * GET /api/reposicao/debug/:clientId/:saleId
 * Debug endpoint: shows raw data from SeuFisio for a sale
 */
router.get('/debug/:clientId/:saleId', async (req: Request, res: Response) => {
  try {
    const { clientId, saleId } = req.params;
    const saleIdNum = parseInt(saleId as string);

    // Get sales
    const salesData = await seufisioClient.get(`/api/cliente/${clientId}/listar-vendas`, {
      tab: 'ativas',
      page: 1,
      per_page: 100,
    });

    const sale = (salesData.data || []).find((s: any) => s.id === saleIdNum);

    // Get atendimentos to repor
    let atendimentosRepor: any = null;
    try {
      atendimentosRepor = await seufisioClient.get(
        `/api/pacote/${saleIdNum}/get-atendimentos-repor`
      );
    } catch (err: any) {
      atendimentosRepor = { error: err?.response?.data || err.message };
    }

    res.json({
      sale: sale || { error: `Sale ${saleId} not found` },
      atendimentosRepor,
      rawSalesCount: salesData.data?.length || 0,
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.response?.data || error.message });
  }
});

export default router;
