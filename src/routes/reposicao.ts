import { Router, Request, Response } from 'express';
import { seufisioClient } from "../services/seufisio-client";

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
    const { clientId, date, hour: rawHour, saleId } = req.body;

    if (!clientId || !date || !rawHour || !saleId) {
      res.status(400).json({
        error: "Missing required fields: clientId, date, hour, saleId",
      });
      return;
    }

    // Normalize hour to HH:mm to prevent string comparison issues
    const [rawH, rawM] = rawHour.split(":").map(Number);
    const hour = `${String(rawH).padStart(2, "0")}:${String(rawM || 0).padStart(2, "0")}`;

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

    // Step 3: Check availability using calendar slots API
    console.log(
      `[Reposição Create] Checking slot availability for ${date} at ${hour}`,
    );
    let availableProfessional: any = null;
    const requestedStartTime = `${hour}:00`; // e.g. "08:00:00"

    for (const prof of activeProfessionals) {
      try {
        // Fetch calendar slots for this professional on the requested date
        const slots: any[] = await seufisioClient.get("/api/slots/calendario", {
          data_inicial: `${date}T00:00:00`,
          data_final: `${date}T23:59:59`,
          profissional_id: prof.id,
        });

        // Find the slot matching the requested date and hour
        const matchingSlot = slots.find(
          (slot: any) =>
            slot.occur_date === date && slot.start_time === requestedStartTime,
        );

        if (!matchingSlot) {
          console.log(
            `[Reposição Create] Professional ${prof.nome} (${prof.id}): no slot at ${date} ${hour}, skipping`,
          );
          continue;
        }

        const available =
          matchingSlot.total_booked < matchingSlot.total_capacity;
        console.log(
          `[Reposição Create] Professional ${prof.nome} (${prof.id}): ${matchingSlot.total_booked}/${matchingSlot.total_capacity} booked at ${date} ${hour} → ${available ? "AVAILABLE" : "FULL"}`,
        );

        if (available) {
          availableProfessional = prof;
          break;
        }
      } catch (err: any) {
        console.error(
          `[Reposição Create] Failed to fetch calendar for professional ${prof.nome} (${prof.id}):`,
          err?.response?.status || err?.message,
        );
      }
    }

    if (!availableProfessional) {
      res.status(409).json({
        error: `No professional available at ${date} ${hour}. All professionals are fully booked for this time slot.`,
      });
      return;
    }

    // Step 5: Get atendimentos to repor (for remarcado_id) — REQUIRED
    // Different endpoint depending on sale type
    const isServicoRecorrente = sale.tipoVenda === "servico_recorrente";
    const reporEndpoint = isServicoRecorrente
      ? `/api/servico-ciclo/${sale.id}/get-atendimentos-repor-by-servico-id`
      : `/api/pacote/${sale.id}/get-atendimentos-repor`;

    console.log(
      `[Reposição Create] tipoVenda: ${sale.tipoVenda}, endpoint: ${reporEndpoint}`,
    );

    let remarcadoId: number | null = null;

    try {
      const atendimentosRepor: any[] = await seufisioClient.get(reporEndpoint);

      console.log(
        `[Reposição Create] Atendimentos to repor: ${JSON.stringify(atendimentosRepor)}`,
      );

      if (atendimentosRepor && atendimentosRepor.length > 0) {
        remarcadoId = atendimentosRepor[0].id;
        console.log(`[Reposição Create] Found remarcado_id: ${remarcadoId}`);
      }
    } catch (err: any) {
      console.error(
        `[Reposição Create] Failed to get atendimentos to repor:`,
        err?.response?.data || err?.message,
      );
    }

    if (!remarcadoId) {
      res.status(404).json({
        error:
          "Could not find the original attendance for reposition (remarcado_id).",
        debug: {
          saleId: sale.id,
          tipoVenda: sale.tipoVenda,
          endpointUsed: reporEndpoint,
        },
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
      convenio_id: null,
      status_id: 1,
      remarcado_id: remarcadoId,
      pacote_fixo_id: null,
      // servico_recorrente uses servico_ciclo_id, pacote uses pacote_id
      pacote_id: isServicoRecorrente ? null : sale.id,
      is_pacote: isServicoRecorrente ? cicloId : sale.id,
      servico_ciclo_id: isServicoRecorrente ? cicloId : null,
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
