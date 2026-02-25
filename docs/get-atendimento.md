## Auth API

```CURL
curl 'https://api.seufisio.com.br/api/atendimento/6328' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'accept-language: pt-BR,pt;q=0.9' \
  -H 'acesso: web-desktop' \
  -H 'authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiMjgwZTViZTBlZjJkYmZiYzcxZGMwZjZmYzk5OTFmNDA3NDYyYjNmNDc5MjM4OWYzYjJlMzBhYzY4Mzk3M2IwMjU4ZjFkOTBkODUwMmRlYWIiLCJpYXQiOjE3NzE5NzYzNTguNTM3NTM1LCJuYmYiOjE3NzE5NzYzNTguNTM3NTM3LCJleHAiOjE3NzIxNTI3NTguNTIzNjc4LCJzdWIiOiIyMTcxNCIsInNjb3BlcyI6W119.cUY8Ceg7zFBMIoHyviWnMFbEwd5Lh1KguvaNAHiyerk3_q5BwyOsN9kIHZUIToENDFKR69niKwdJEhjaziJwfyJHW57MrivQsb9ts5LP6-TQ-r6_hQIal7gfMkRFSoSthKFQyCWvUhjcF6EyKREwJ6nAktMACEyjyrXVvdj7Xqzbr8kTl3XarvkE2pGN69NWIe1KTPASqNLSfAwbZdKyJS8qf3PYk3PCi_SIMq9Qg41QZHQq2ZUt8QIH4GejS-m7iBIfXV7gjhEgiMKSH6Uu77TvATVXTkEvsjBBXVyQgkAqD2B4ON6O_pVZ88LoB6GU-pCXi7aWIzJroEfkzS3YBN3aGov-lpYZZC8V1gHO5cS_m8zOWry2uHXb5Co5CF7Z0fKjnxztQknR042T8sc2dN6kYQ8IG4aMo9hlmftkWRIrk1ir24CxuKe1RxOXRywIxY78E84EP0Uqnk_QX4l9R_omjuDuXh7ZYoE0bFu_92y1kS3FxRUK5AeMwi7RGzTjFX70co_I9BybHApXwnEPXRtEpknlp-yI9xoP3xvjReCWf5b5u2HJHKbpz0hPFwldrvEwxqoa52VEG6I0r_-PDLRzmEu3BxxKk-JYMjn09YTYNdoAn38lwZ9OV6I0vqc5ggnvpegVuqRTfJYkKr0RGNHi_BXB5HzoSnJWgEvcC3Q' \
  -H 'origin: https://app.seufisio.com.br' \
  -H 'priority: u=1, i' \
  -H 'referer: https://app.seufisio.com.br/' \
  -H 'sec-ch-ua: "Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-site' \
  -H 'setfisio: 9208' \
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36' \
  -H 'x-requested-with: XMLHttpRequest' \
  -H 'x-version-app: 24'
```

## Response

```JSON
{
    "id": 6328,
    "cliente_id": 216,
    "profissional_id": 1,
    "data_atendimento": "2026-02-25",
    "hora_atendimento": "10:00:00",
    "hora_final_atendimento": "10:50:00",
    "hora_chegada": null,
    "status_id": 6,
    "convenio_id": null,
    "valor": 0,
    "obs": null,
    "tipo_atendimento_id": 12,
    "pago": 0,
    "sala_id": 1,
    "pacote_id": 15,
    "ordem_pacote": 3,
    "arquivos": null,
    "prontuario_finalizado": false,
    "aula_experimental": false,
    "forma_pagamento_id": null,
    "pacote_fixo_id": null,
    "acompanhante": null,
    "remarcado_id": null,
    "confirmado": false,
    "data_confirmacao_user": null,
    "data_confirmacao_cliente": null,
    "data_confirmacao_checkin_gympass": null,
    "data_confirmacao_cliente_app": null,
    "data_cancelamento_cliente_app": null,
    "justificativa_cancelamento_cliente": null,
    "peso": null,
    "altura": null,
    "perimetro_cefalico": null,
    "qt_email_enviado": 0,
    "imc": null,
    "whatsapp_enviado": false,
    "nao_descontar_comissao": 0,
    "created_at": "2026-02-18T12:43:16.000000Z",
    "updated_at": "2026-02-25T03:45:52.000000Z",
    "circunferencia_cintura": null,
    "circunferencia_abdominal": null,
    "whatsapp_automatico_enviado": 0,
    "whatsapp_lembrete_enviado": 0,
    "created_by_user_id": null,
    "agendamento_online": false,
    "percentual_gordura": null,
    "percentual_massa_magra": null,
    "flexibilidade": null,
    "atendimento_combo_id": null,
    "circunferencia_umbilical": null,
    "circunferencia_umbilical_acima": null,
    "circunferencia_umbilical_abaixo": null,
    "peso_massa_gorda": null,
    "peso_massa_magra": null,
    "gordura_visceral": null,
    "taxa_metabolica": null,
    "coxa_direita": null,
    "coxa_esquerda": null,
    "panturrilha_direita": null,
    "panturrilha_esquerda": null,
    "braco_direito": null,
    "braco_esquerdo": null,
    "circunferencia_quadril": null,
    "servico_ciclo_id": null,
    "slot_id": null,
    "data_remarcacao_cliente_app": null,
    "booking_number": null,
    "data_agendamento_cliente_app": null,
    "utiliza_total_pass": false,
    "data_confirmacao_total_pass": null,
    "turma_slot_id": null,
    "desmarcado": false,
    "aparelhos": [],
    "email_automatico_enviado": 0,
    "origem_agendamento": "sistema",
    "origem_confirmacao": "",
    "data_hora_confirmacao": null,
    "auditoria_checkin_facial_id": null,
    "whatsapp_lembrete_job_id": null,
    "prontuarioOriginal": null,
    "cliente_nome": "Kelwin Sanches Savoia",
    "cliente_cpf": null,
    "cliente_telefone": "(11) 97023-1208",
    "cliente_telefone_ddi": "BR",
    "cliente_email": null,
    "cliente_foto": null,
    "cliente_servico_id": null,
    "data_envio_whatsapp_boas_vindas": null,
    "informacoes_preliminares": null,
    "obs_remarcacao": "",
    "qtd_atendimentos_realizados": false,
    "usuario_id": 21714,
    "data_hora_inicial": "2026-02-25 10:00:00",
    "status": {
        "id": 6,
        "nome": "Aus\u00eancia Justificada",
        "abreviacao": "AJ",
        "color": "#ba68c8",
        "class": "purple",
        "ativo": true
    },
    "gerar_conta": false,
    "gerar_conta_combo": false,
    "prontuario_vazio": true,
    "tipo_valor": 80,
    "tipo": {
        "id": 12,
        "nome": "Aula Avulsa",
        "valor_mensal": 80,
        "valor_bimestral": null,
        "valor_trimestral": null,
        "valor_quadrimestral": null,
        "valor_semestral": null,
        "valor_anual": null,
        "tipo_pagamento_pacote": 2,
        "created_at": "2025-04-28T20:44:19.000000Z",
        "updated_at": "2025-04-28T20:44:19.000000Z",
        "ativo": true,
        "periodo_atendimento": 50,
        "centro_custo_id": 1,
        "is_gympass": false,
        "moloni_id": null,
        "profissional_padrao_id": null,
        "sala_padrao_id": null,
        "agendamento_online": true,
        "agendamento_online_nome_exibicao": "Aula Avulsa",
        "agendamento_online_mostrar_valor": true,
        "permitir_agendar_novamente": true,
        "nota_fiscal_descricao": null,
        "nota_fiscal_codigo_servico_municipio": null,
        "valor_octomestral": null,
        "codigo_nbs": null,
        "classificacao_tributaria": null,
        "codigo_indicador_operacao": null
    },
    "atendimento_remarcado": null,
    "profissional": {
        "id": 1,
        "nome": "Priscila Graciele Assis Ferreira Savoia",
        "email": null,
        "data_nascimento": null,
        "curriculo": null,
        "foto": null,
        "inicio_atendimento": "07:00:00",
        "fim_atendimento": "21:00:00",
        "periodo_atendimento": 50,
        "data_exclusao": null,
        "domingo": false,
        "segunda": true,
        "terca": true,
        "quarta": true,
        "quinta": true,
        "sexta": true,
        "sabado": false,
        "registro": "379472-F",
        "formato_folha": 0,
        "visualizar_meus_atendimentos": true,
        "created_at": "2024-11-18T19:52:12.000000Z",
        "updated_at": "2026-02-07T17:46:27.000000Z",
        "padrao_evolucao_prontuario": "<p><strong>QUEIXAS E RELATOS INICIAIS:<\/strong><\/p><p>&nbsp;<\/p><p><strong>CONDUTA:<\/strong><\/p><p>&nbsp;<\/p>",
        "enviar_whatsapp_automatico": false,
        "cor_agenda": "#28a67e",
        "tempo_agenda": "01:00:00",
        "exibir_aparelhos_prontuario": true,
        "exibir_exercicios_prontuario": true,
        "campos_prontuario": [
            "peso",
            "altura",
            "imc"
        ],
        "mostrar_pacotes_fixos_futuros": true,
        "tipo_prontuario": "classic",
        "habilita_mapa_aplicacao": 0,
        "servicos_agendamento_online": [],
        "valor_comissionamento": [
            {
                "tipo_atendimento_id": 12,
                "tipo_comissao": null,
                "valor": 0
            },
            {
                "tipo_atendimento_id": 6,
                "tipo_comissao": null,
                "valor": 0
            },
            {
                "tipo_atendimento_id": 5,
                "tipo_comissao": null,
                "valor": 0
            },
            {
                "tipo_atendimento_id": 7,
                "tipo_comissao": null,
                "valor": 0
            },
            {
                "tipo_atendimento_id": 1,
                "tipo_comissao": null,
                "valor": 0
            },
            {
                "tipo_atendimento_id": 8,
                "tipo_comissao": null,
                "valor": 0
            },
            {
                "tipo_atendimento_id": 2,
                "tipo_comissao": null,
                "valor": 0
            },
            {
                "tipo_atendimento_id": 9,
                "tipo_comissao": null,
                "valor": 0
            },
            {
                "tipo_atendimento_id": 3,
                "tipo_comissao": null,
                "valor": 0
            },
            {
                "tipo_atendimento_id": 10,
                "tipo_comissao": null,
                "valor": 0
            },
            {
                "tipo_atendimento_id": 4,
                "tipo_comissao": null,
                "valor": 0
            },
            {
                "tipo_atendimento_id": 11,
                "tipo_comissao": null,
                "valor": 0
            },
            {
                "tipo_atendimento_id": 13,
                "tipo_comissao": null,
                "valor": 0
            }
        ],
        "versao_prontuario": "MedicalRecord",
        "visualizar_prontuarios": 0,
        "comissoes_personalizadas": "[]",
        "salas_disponiveis_ids": [
            {
                "id": 1,
                "ativo": true
            }
        ],
        "mostrar_quantidade_vagas": true
    },
    "sala": {
        "id": 1,
        "nome": "Sala 01",
        "created_at": "2024-11-18T19:52:12.000000Z",
        "updated_at": "2024-11-18T19:52:12.000000Z",
        "color": "#e47603",
        "bloqueada": false,
        "verifica_conflito_horarios": 1,
        "ativo": true
    }
}
```
