/**
 * Type declarations for client.js (the intent-log client replica). See
 * engine-types.d.ts for the lockstep discipline.
 */

import type {
	ClientReplica,
	EngineDocument,
	IntentDisposition,
	IntentEnvelope,
} from './engine-types';

export function createClient(
	actorId: string,
	initialDoc: EngineDocument,
	firstSeq?: number
): ClientReplica;

export function trimClientLog( client: ClientReplica ): void;

export function authorIntent(
	client: ClientReplica,
	intent: IntentEnvelope
): IntentDisposition;

export function predictedDisposition(
	client: ClientReplica,
	intentId: string
): IntentDisposition | null;

export function clientReceive(
	client: ClientReplica,
	entries: IntentEnvelope[],
	startSeq: number
): void;
