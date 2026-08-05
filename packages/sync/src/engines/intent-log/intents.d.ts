/**
 * Type declarations for intents.js (the intent vocabulary and envelope).
 * See engine-types.d.ts for the lockstep discipline.
 */

import type { IntentEnvelope } from './engine-types';

export declare const IntentTypes: Record< string, string >;

export declare const TEXT_INTENT_TYPES: Set< string >;

export function createIntent(
	type: string,
	payload: Record< string, unknown >,
	envelope: {
		actorId: string;
		baseSeq: number;
		txnId?: string;
		intentId?: string;
	}
): IntentEnvelope;

export function withPayload(
	intent: IntentEnvelope,
	payloadChanges: Record< string, unknown >
): IntentEnvelope;
