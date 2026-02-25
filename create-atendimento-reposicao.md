## Auth API

```CURL
curl 'https://api.seufisio.com.br/api/atendimento' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'accept-language: pt-BR,pt;q=0.9' \
  -H 'acesso: web-desktop' \
  -H 'authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiMjgwZTViZTBlZjJkYmZiYzcxZGMwZjZmYzk5OTFmNDA3NDYyYjNmNDc5MjM4OWYzYjJlMzBhYzY4Mzk3M2IwMjU4ZjFkOTBkODUwMmRlYWIiLCJpYXQiOjE3NzE5NzYzNTguNTM3NTM1LCJuYmYiOjE3NzE5NzYzNTguNTM3NTM3LCJleHAiOjE3NzIxNTI3NTguNTIzNjc4LCJzdWIiOiIyMTcxNCIsInNjb3BlcyI6W119.cUY8Ceg7zFBMIoHyviWnMFbEwd5Lh1KguvaNAHiyerk3_q5BwyOsN9kIHZUIToENDFKR69niKwdJEhjaziJwfyJHW57MrivQsb9ts5LP6-TQ-r6_hQIal7gfMkRFSoSthKFQyCWvUhjcF6EyKREwJ6nAktMACEyjyrXVvdj7Xqzbr8kTl3XarvkE2pGN69NWIe1KTPASqNLSfAwbZdKyJS8qf3PYk3PCi_SIMq9Qg41QZHQq2ZUt8QIH4GejS-m7iBIfXV7gjhEgiMKSH6Uu77TvATVXTkEvsjBBXVyQgkAqD2B4ON6O_pVZ88LoB6GU-pCXi7aWIzJroEfkzS3YBN3aGov-lpYZZC8V1gHO5cS_m8zOWry2uHXb5Co5CF7Z0fKjnxztQknR042T8sc2dN6kYQ8IG4aMo9hlmftkWRIrk1ir24CxuKe1RxOXRywIxY78E84EP0Uqnk_QX4l9R_omjuDuXh7ZYoE0bFu_92y1kS3FxRUK5AeMwi7RGzTjFX70co_I9BybHApXwnEPXRtEpknlp-yI9xoP3xvjReCWf5b5u2HJHKbpz0hPFwldrvEwxqoa52VEG6I0r_-PDLRzmEu3BxxKk-JYMjn09YTYNdoAn38lwZ9OV6I0vqc5ggnvpegVuqRTfJYkKr0RGNHi_BXB5HzoSnJWgEvcC3Q' \
  -H 'content-type: application/json' \
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
  -H 'x-version-app: 24' \
  --data-raw '{"cliente_id":217,"profissional_id":1,"data_atendimento":"2026-02-27","duracao_atendimento":50,"hora_atendimento":"20:00","sala_id":1,"tipo_atendimento_id":9,"status_id":1,"remarcado_id":6967,"is_pacote":318,"servico_ciclo_id":318,"aula_experimental":false,"created_by_user_id":21714,"hora_final_atendimento":"20:50","atualizar_valor_cobranca_ciclo":false}'
```

## Response

```JSON
{
    "cliente_id": 216,
    "profissional_id": 1,
    "data_atendimento": "2026-02-25",
    "hora_atendimento": "09:30",
    "sala_id": 1,
    "tipo_atendimento_id": 12,
    "status_id": 1,
    "remarcado_id": 6331,
    "pacote_id": 15,
    "aula_experimental": false,
    "created_by_user_id": 21714,
    "hora_final_atendimento": "10:20",
    "updated_at": "2026-02-25T00:45:35.000000Z",
    "created_at": "2026-02-25T00:45:35.000000Z",
    "id": 6965,
    "data_hora_inicial": "2026-02-25 09:30",
    "status": {
        "id": 1,
        "nome": "Aguardando Chegar",
        "abreviacao": "AC",
        "color": "#64b5f6",
        "class": "blue",
        "ativo": true
    },
    "gerar_conta": false,
    "gerar_conta_combo": false,
    "prontuario_vazio": true,
    "tipo_valor": 80,
    "cliente": {
        "id": 216,
        "nome": "Kelwin Sanches Savoia",
        "telefone": "(11) 97023-1208",
        "telefone_2": null,
        "email": null,
        "convenio_id": null,
        "text_id_convenio": null,
        "categoria": null,
        "endereco": null,
        "bairro_id": null,
        "data_nascimento": null,
        "estado_civil": null,
        "profissao": null,
        "cpf": null,
        "rg": null,
        "endereco_numero": null,
        "endereco_complemento": null,
        "sexo": 1,
        "pai": null,
        "mae": null,
        "valor_default": null,
        "observacao": null,
        "foto": null,
        "doencas": null,
        "altura": null,
        "peso": null,
        "paga_adiantado": 1,
        "informacoes_preliminares": null,
        "situacao": 2,
        "cep": null,
        "queixas_principais": null,
        "diagnosticos": null,
        "tipo_aluno": 0,
        "domingo": false,
        "segunda": false,
        "terca": false,
        "quarta": false,
        "quinta": false,
        "sexta": false,
        "sabado": false,
        "valor": 0,
        "tipo_atendimento_id": null,
        "sala_id": null,
        "profissional_id_domingo": null,
        "profissional_id_segunda": null,
        "profissional_id_terca": null,
        "profissional_id_quarta": null,
        "profissional_id_quinta": null,
        "profissional_id_sexta": null,
        "profissional_id_sabado": null,
        "hora_domingo": "",
        "hora_segunda": "",
        "hora_terca": "",
        "hora_quarta": "",
        "hora_quinta": "",
        "hora_sexta": "",
        "hora_sabado": "",
        "dia_padrao_renovacao": null,
        "dia_padrao_cobranca": null,
        "procedencia_id": null,
        "imc": null,
        "data_envio_whatsapp_aniversario": null,
        "created_at": "2026-02-18T10:59:04.000000Z",
        "updated_at": "2026-02-18T10:59:04.000000Z",
        "cliente_desde": "2026-02-18",
        "cidade_id": null,
        "telefone_responsavel": null,
        "tipo_cliente": 1,
        "data_inativacao": null,
        "cartao_cidadao": null,
        "nif": null,
        "data_envio_whatsapp_tempo_clinica": null,
        "pacote_fixo_recorrente": 0,
        "sala_id_domingo": null,
        "sala_id_segunda": null,
        "sala_id_terca": null,
        "sala_id_quarta": null,
        "sala_id_quinta": null,
        "sala_id_sexta": null,
        "sala_id_sabado": null,
        "nivel_id": null,
        "mostrar_renovacao_pacote": true,
        "telefone_ddi": "BR",
        "telefone_2_ddi": "BR",
        "telefone_responsavel_ddi": "BR",
        "pacote_fixo_cobranca_automatica": false,
        "uf": null,
        "cidade": null,
        "bairro": null,
        "data_envio_whatsapp_boas_vindas": null,
        "contrato_atual_id": null,
        "gympass_token": null,
        "documento_identificacao": null,
        "nome_registro": "Kelwin Sanches Savoia",
        "data_conversao": null,
        "data_fechamento_prospeccao": null,
        "data_criacao_prospect": null,
        "moloni_id": null,
        "data_ultima_ativacao": null,
        "mostrar_treinos": false,
        "instagram": null,
        "observacao_moloni": null,
        "motivo_procura": null,
        "informa\u00e7\u00f5es_pedidas": null,
        "forma_contato_prospeccao_id": null,
        "indicacao_interna_id": null,
        "indicacao_externa_nome": null,
        "motivos_nao_efetivacao_id": null,
        "estagio_lead_id": null,
        "usuario_responsavel_lead_id": null,
        "quantidade_reposicoes_por_ciclo": null,
        "ignorar_quantidade_reposicoes_por_ciclo": true,
        "mostrar_faturas": true,
        "total_pass_token": null,
        "permitir_reposicoes_apos_termino": true,
        "sincronizado_desktop": false,
        "acesso_liberado": false,
        "autorizo_uso_imagem": false,
        "data_cadastro_rosto_checkin": null,
        "url_avatar": ""
    },
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
    }
}
```
