/**
 * har-to-spec — converte um HAR exportado do Chrome DevTools em spec markdown
 * no mesmo formato dos arquivos de `docs/` (Request cURL + Response JSON).
 *
 * Uso:
 *   npx tsx scripts/har-to-spec.ts capturas/criar-plano.har --out docs/criar-plano.md
 *
 * Flags:
 *   --out <arquivo>      arquivo markdown de saída (default: stdout)
 *   --host <substr>      só requests cujo host contém isso (default: api.seufisio.com.br)
 *   --filter <substr>    só requests cuja URL contém isso (pode repetir)
 *   --exclude <substr>   ignora requests cuja URL contém isso (pode repetir)
 *   --max-array <n>      corta arrays de resposta em n itens (default: 3, 0 = sem corte)
 *   --max-chars <n>      corta corpo de resposta em n caracteres (default: 4000)
 *   --summary            imprime só a tabela resumo (útil pra ver o fluxo antes)
 *   --no-get             ignora GETs (foca nas escritas: POST/PUT/PATCH/DELETE)
 */
import { readFileSync, writeFileSync } from 'node:fs';

type Header = { name: string; value: string };
type Entry = {
  startedDateTime: string;
  time?: number;
  request: {
    method: string;
    url: string;
    headers: Header[];
    queryString?: Header[];
    postData?: { mimeType?: string; text?: string; params?: Header[] };
  };
  response: {
    status: number;
    statusText?: string;
    headers: Header[];
    content?: { mimeType?: string; text?: string; encoding?: string };
  };
};

// ---------- args ----------
const argv = process.argv.slice(2);
const harPath = argv.find((a) => !a.startsWith('--'));
if (!harPath) {
  console.error('uso: npx tsx scripts/har-to-spec.ts <arquivo.har> [--out docs/x.md] [--summary]');
  process.exit(1);
}
function flag(name: string): string | undefined {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
}
function flags(name: string): string[] {
  const out: string[] = [];
  argv.forEach((a, i) => {
    if (a === `--${name}` && argv[i + 1]) out.push(argv[i + 1]);
  });
  return out;
}
const has = (name: string) => argv.includes(`--${name}`);

const outFile = flag('out');
const host = flag('host') ?? 'api.seufisio.com.br';
const filters = flags('filter');
const excludes = flags('exclude');
const maxArray = Number(flag('max-array') ?? 3);
const maxChars = Number(flag('max-chars') ?? 4000);
const summaryOnly = has('summary');
const noGet = has('no-get');

// ---------- headers que valem manter no cURL ----------
const KEEP_HEADERS = [
  'accept',
  'acesso',
  'authorization',
  'content-type',
  'origin',
  'referer',
  'setfisio',
  'x-requested-with',
  'x-version-app',
];
const REDACT = ['authorization', 'cookie', 'set-cookie', 'x-csrf-token'];

function headerValue(headers: Header[], name: string): string | undefined {
  return headers.find((h) => h.name.toLowerCase() === name)?.value;
}

function redact(name: string, value: string): string {
  const n = name.toLowerCase();
  if (!REDACT.includes(n)) return value;
  if (n === 'authorization') return 'Bearer <TOKEN>';
  return '<REDACTED>';
}

// ---------- body helpers ----------
function tryParse(text?: string): unknown | undefined {
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function decodeContent(content?: Entry['response']['content']): string | undefined {
  if (!content?.text) return undefined;
  if (content.encoding === 'base64') {
    try {
      return Buffer.from(content.text, 'base64').toString('utf8');
    } catch {
      return undefined;
    }
  }
  return content.text;
}

/** Corta arrays longos, mantendo os primeiros `maxArray` itens. */
function trimArrays(value: unknown, depth = 0): unknown {
  if (maxArray <= 0 || depth > 8) return value;
  if (Array.isArray(value)) {
    const kept = value.slice(0, maxArray).map((v) => trimArrays(v, depth + 1));
    if (value.length > maxArray) kept.push(`… +${value.length - maxArray} itens (cortado)` as never);
    return kept;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = trimArrays(v, depth + 1);
    }
    return out;
  }
  return value;
}

function fmtJson(value: unknown): string {
  let text = JSON.stringify(value, null, 2) ?? 'null';
  if (maxChars > 0 && text.length > maxChars) {
    text = `${text.slice(0, maxChars)}\n… (corpo cortado em ${maxChars} caracteres)`;
  }
  return text;
}

function buildCurl(entry: Entry): string {
  const { method, url, headers, postData } = entry.request;
  const lines = [`curl '${url}' \\`];
  if (method !== 'GET') lines.push(`  -X ${method} \\`);
  const relevant = headers
    .filter((h) => KEEP_HEADERS.includes(h.name.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));
  for (const h of relevant) {
    lines.push(`  -H '${h.name.toLowerCase()}: ${redact(h.name, h.value)}' \\`);
  }
  const body = postData?.text;
  if (body) {
    const parsed = tryParse(body);
    const pretty = parsed !== undefined ? JSON.stringify(parsed) : body;
    lines.push(`  --data-raw '${pretty.replace(/'/g, "'\\''")}'`);
  } else {
    lines[lines.length - 1] = lines[lines.length - 1].replace(/ \\$/, '');
  }
  return lines.join('\n');
}

// ---------- load ----------
const har = JSON.parse(readFileSync(harPath, 'utf8'));
const allEntries: Entry[] = har?.log?.entries ?? [];

const entries = allEntries
  .filter((e) => {
    const url = e.request?.url ?? '';
    if (!url.includes(host)) return false;
    if (e.request.method === 'OPTIONS') return false;
    if (noGet && e.request.method === 'GET') return false;
    if (filters.length && !filters.some((f) => url.includes(f))) return false;
    if (excludes.some((x) => url.includes(x))) return false;
    return true;
  })
  .sort((a, b) => a.startedDateTime.localeCompare(b.startedDateTime));

if (!entries.length) {
  console.error(`nenhuma request encontrada para host "${host}" em ${harPath} (total no HAR: ${allEntries.length})`);
  process.exit(1);
}

// ---------- render ----------
function pathOf(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

const out: string[] = [];
const title = (outFile ?? harPath).split('/').pop()!.replace(/\.(md|har)$/, '');
out.push(`# Fluxo capturado — ${title}`);
out.push('');
out.push(`Gerado de \`${harPath}\` por \`scripts/har-to-spec.ts\`, em ordem cronológica.`);
out.push('Tokens e cookies redigidos. Arrays e corpos longos foram cortados.');
out.push('');
out.push('## Resumo do fluxo');
out.push('');
out.push('| # | Método | Path | Status | Query |');
out.push('| --- | --- | --- | --- | --- |');
entries.forEach((e, i) => {
  const q = (e.request.queryString ?? []).map((p) => `${p.name}=${p.value}`).join('&');
  out.push(`| ${i + 1} | ${e.request.method} | \`${pathOf(e.request.url)}\` | ${e.response.status} | ${q ? `\`${q}\`` : '—'} |`);
});
out.push('');

if (!summaryOnly) {
  entries.forEach((e, i) => {
    out.push('---');
    out.push('');
    out.push(`## ${i + 1}. ${e.request.method} ${pathOf(e.request.url)}`);
    out.push('');
    out.push(`\`${e.startedDateTime}\` · status **${e.response.status}**${e.time ? ` · ${Math.round(e.time)}ms` : ''}`);
    out.push('');

    const query = e.request.queryString ?? [];
    if (query.length) {
      out.push('### Query params');
      out.push('');
      out.push('| Param | Valor |');
      out.push('| --- | --- |');
      for (const p of query) out.push(`| \`${p.name}\` | \`${p.value}\` |`);
      out.push('');
    }

    out.push('### Request');
    out.push('');
    out.push('```CURL');
    out.push(buildCurl(e));
    out.push('```');
    out.push('');

    const reqBody = e.request.postData?.text;
    if (reqBody) {
      const parsed = tryParse(reqBody);
      out.push('#### Body');
      out.push('');
      out.push('```JSON');
      out.push(parsed !== undefined ? fmtJson(parsed) : reqBody.slice(0, maxChars));
      out.push('```');
      out.push('');
    }

    out.push('### Response');
    out.push('');
    const respText = decodeContent(e.response.content);
    const respJson = tryParse(respText);
    if (respJson !== undefined) {
      out.push('```JSON');
      out.push(fmtJson(trimArrays(respJson)));
      out.push('```');
    } else if (respText) {
      out.push('```');
      out.push(respText.slice(0, maxChars));
      out.push('```');
    } else {
      out.push('_corpo não capturado no HAR (exporte com conteúdo / "with sensitive data")._');
    }
    out.push('');
  });
}

const markdown = out.join('\n');
if (outFile) {
  writeFileSync(outFile, markdown);
  console.error(`✔ ${entries.length} requests → ${outFile}`);
} else {
  process.stdout.write(markdown);
}
