# Como capturar as requests do SeuFisio (para virar spec)

Fluxo para documentar um fluxo novo (ex.: criar plano) fazendo ele manualmente
no app do SeuFisio e transformando o tráfego em spec markdown.

## 1. Gravar o HAR no Chrome

1. Abra `https://app.seufisio.com.br` e faça login **antes** de começar a gravar
   (assim o login não entra na captura).
2. `Cmd+Option+I` → aba **Network**.
3. Marque **Preserve log** e clique no filtro **Fetch/XHR**.
4. Clique no ícone 🚫 (Clear) para zerar a lista.
5. Faça o fluxo manualmente, do começo ao fim, **sem pressa e sem cliques extras** —
   toda request extra vira ruído na spec.
6. Clique com o botão direito em qualquer linha da lista → **Save all as HAR with content**
   (em Chrome recente: botão de download ↓ → *Export HAR (with sensitive data)*).
   O "with content"/"sensitive data" é obrigatório: sem ele o Chrome não salva os
   corpos de resposta nem o header `authorization`.
7. Salve em `capturas/<nome-do-fluxo>.har`. Essa pasta é gitignored — **o HAR contém
   seu token de acesso em texto puro**, não commite.

## 2. Converter em spec

```bash
npm run har -- capturas/criar-plano.har --summary          # só a tabela do fluxo
npm run har -- capturas/criar-plano.har --out docs/criar-plano.md
```

O script (`scripts/har-to-spec.ts`) ordena por horário, ignora `OPTIONS` e hosts que
não sejam a API, redige `authorization`/`cookie`, decodifica respostas em base64 e gera
o mesmo formato dos outros arquivos de `docs/` (cURL + JSON).

Flags úteis:

| Flag | O que faz |
| --- | --- |
| `--summary` | imprime só a tabela resumo (rode primeiro, pra conferir o fluxo) |
| `--no-get` | mantém só as escritas (POST/PUT/PATCH/DELETE) |
| `--filter <substr>` | só URLs contendo isso (repetível) — ex.: `--filter /api/pacote` |
| `--exclude <substr>` | descarta URLs contendo isso (repetível) — ex.: `--exclude /api/notificacao` |
| `--max-array <n>` | itens mantidos por array na resposta (default 3, `0` = tudo) |
| `--max-chars <n>` | corte do corpo em caracteres (default 4000) |
| `--host <substr>` | host alvo (default `api.seufisio.com.br`) |
| `--out <arquivo>` | escreve no arquivo em vez de stdout |

## 3. Revisar antes de implementar

O gerado é rascunho: junte requests repetidas (polling, listas recarregadas), marque
quais campos são fixos e quais vêm da tela anterior, e só então crie/ajuste a rota em
`src/routes/`.

## Alternativa: gravar continuamente

Se virar rotina capturar fluxos, dá pra instalar um userscript (Tampermonkey) em
`app.seufisio.com.br` que faz monkeypatch de `fetch`/`XMLHttpRequest` e manda cada
par request/response para um endpoint de gravação neste proxy. Vantagem: nada de
exportar HAR na mão. Custo: instalar a extensão + manter o endpoint. Só vale se a
captura passar a ser frequente.
