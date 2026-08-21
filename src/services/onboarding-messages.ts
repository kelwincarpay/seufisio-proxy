/**
 * WhatsApp copy for the post-sale onboarding flow.
 *
 * Texts approved 21/08/2026 — see docs/mensagens-onboarding.md. Voice is calibrated
 * on the class reminder in reminder-cron.ts: "Oi, {nome}!", one sentence with the
 * reason ending in 💚, bold instruction, italic slogan closing.
 *
 * Edit copy here; the cron holds no strings of its own.
 */

const SLOGAN = '_Você é a arte que se move_';

export interface PendingContract {
  id: number;
  nome_contrato: string;
  link: string;
  /** Filled when the client opened the link but did not finish signing. */
  aberto: boolean;
}

function firstName(fullName?: string): string {
  const name = (fullName || '').trim();
  return name ? name.split(/\s+/)[0] : '';
}

function greeting(fullName?: string): string {
  const name = firstName(fullName);
  return name ? `Oi, ${name}!` : 'Oi!';
}

/** "Contrato do plano" / "Termo de consentimento" → subject for the sentence. */
function subject(contracts: PendingContract[]): string {
  const labels = contracts.map((c) =>
    /termo/i.test(c.nome_contrato) ? 'o termo de consentimento' : 'seu contrato',
  );
  if (labels.length === 0) return 'seus documentos';
  if (labels.length === 1) return labels[0];
  // "seu contrato e o termo de consentimento"
  return `${labels.slice(0, -1).join(', ')} e ${labels[labels.length - 1]}`;
}

/** Friendly label above each link. */
function docLabel(nome_contrato: string): string {
  return /termo/i.test(nome_contrato) ? 'Termo de consentimento' : 'Contrato do plano';
}

function linkBlock(contracts: PendingContract[]): string {
  return contracts.map((c) => `📄 *${docLabel(c.nome_contrato)}*\n${c.link}`).join('\n\n');
}

/** 1. Plan created — ask the client to complete their registration. */
export function registrationRequest(opts: {
  nome: string;
  tipo_atendimento: string;
  dias_e_horarios: string;
  link: string;
}): string {
  return (
    `${greeting(opts.nome)}\n\n` +
    `Seu plano no MovArt Pilates já está criado: ${opts.tipo_atendimento}, ${opts.dias_e_horarios}. 💚\n\n` +
    `Para emitir seu contrato falta completar seu cadastro. É onde entram endereço, data de nascimento, profissão e estado civil.\n\n` +
    `📝 *${opts.link}*\n\n` +
    SLOGAN
  );
}

/** 2. Registration still incomplete after the resend window. */
export function registrationReminder(opts: { nome: string; link: string }): string {
  return (
    `${greeting(opts.nome)}\n\n` +
    `Passando aqui para lembrar do seu cadastro no MovArt Pilates. Ele ainda está incompleto, e é o que falta para emitir seu contrato. 💚\n\n` +
    `📝 *${opts.link}*\n\n` +
    SLOGAN
  );
}

/** 3. Registration complete, both contracts generated and waiting for signature. */
export function contractsReady(opts: { nome: string; contracts: PendingContract[] }): string {
  return (
    `${greeting(opts.nome)}\n\n` +
    `Seu cadastro está completo. 💚 Agora são dois documentos para assinar, a assinatura é feita na própria tela:\n\n` +
    `${linkBlock(opts.contracts)}\n\n` +
    SLOGAN
  );
}

/**
 * 4. Signature nudge. Lists only what is still pending. Two variants: the client
 * never opened the link, or opened it and stopped halfway (data_hora_abertura set
 * with data_hora_assinatura still null).
 */
export function signatureReminder(opts: { nome: string; contracts: PendingContract[] }): string {
  const opened = opts.contracts.some((c) => c.aberto);
  const what = subject(opts.contracts);

  const reason = opened
    ? `Vi que você abriu ${what} mas não chegou a finalizar a assinatura. Se ficou alguma dúvida, pode me chamar por aqui. 💚`
    : `Ficou faltando assinar ${what}. É o último passo para fechar seu plano no MovArt Pilates. 💚`;

  return `${greeting(opts.nome)}\n\n${reason}\n\n${linkBlock(opts.contracts)}\n\n${SLOGAN}`;
}

/** 5. Everything signed. No check-in line: fixed-plan clients don't check in. */
export function onboardingComplete(opts: { nome: string }): string {
  return (
    `${greeting(opts.nome)}\n\n` +
    `Contrato e termo assinados, seu plano está ativo. 💚\n\n` +
    SLOGAN
  );
}
