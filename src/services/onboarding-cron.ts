import cron from 'node-cron';
import { env } from '../config/env';
import { getSupabase } from './supabase';
import { runOnboardingSweep } from './onboarding';

/** Start the recurring onboarding sweep (no-op if Supabase is not configured). */
export function startOnboardingCron(): void {
  if (!getSupabase()) {
    console.log('[Onboarding] Supabase not configured — onboarding cron disabled.');
    return;
  }
  if (!cron.validate(env.ONBOARDING_CRON)) {
    console.error(`[Onboarding] Invalid ONBOARDING_CRON "${env.ONBOARDING_CRON}" — cron disabled.`);
    return;
  }
  cron.schedule(env.ONBOARDING_CRON, () => {
    runOnboardingSweep().catch((e) => console.error('[Onboarding] Unhandled sweep error:', e));
  });
  console.log(`[Onboarding] Cron scheduled (${env.ONBOARDING_CRON}).`);
}
