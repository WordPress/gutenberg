/**
 * Type declarations for reducer.js (the deterministic reducer). See
 * engine-types.d.ts for the lockstep discipline.
 */

import type {
	EngineDocument,
	IntentDisposition,
	IntentEnvelope,
} from './engine-types';

export function applyIntent(
	doc: EngineDocument,
	intent: IntentEnvelope
): { doc: EngineDocument; disposition: IntentDisposition };

export function replay(
	initialDoc: EngineDocument,
	log: IntentEnvelope[]
): EngineDocument;
