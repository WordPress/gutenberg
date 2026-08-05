/**
 * Type declarations for rebase.js (the planner and in-memory server). See
 * engine-types.d.ts for the lockstep discipline.
 */

import type {
	EngineDocument,
	IntentDisposition,
	IntentEnvelope,
} from './engine-types';

export declare const ESCALATION_REASONS: Set< string >;

export interface IntentLogServer {
	initialDoc: EngineDocument;
	log: IntentEnvelope[];
	proposals: Array< {
		intent: IntentEnvelope;
		actorId: string;
		reason: string;
	} >;
	dispositions: Map< string, IntentDisposition >;
	docCache: Map< number, EngineDocument >;
	recorder?: IntentEnvelope[][];
}

export interface PlanRow {
	intent: IntentEnvelope;
	disposition: IntentDisposition;
	accepted: IntentEnvelope | null;
	proposal: {
		intent: IntentEnvelope;
		actorId: string;
		reason: string;
	} | null;
}

export function groupUnits( intents: IntentEnvelope[] ): IntentEnvelope[][];

export function planBatch(
	units: IntentEnvelope[][],
	log: IntentEnvelope[],
	docAt: ( seq: number ) => EngineDocument
): { rows: PlanRow[]; headDoc: EngineDocument };

export function createServer( initialDoc: EngineDocument ): IntentLogServer;

export function serverDocAt(
	server: IntentLogServer,
	seq: number
): EngineDocument;

export function serverIngestBatch(
	server: IntentLogServer,
	intents: IntentEnvelope[]
): IntentDisposition[];

export function frameReadTargets( intent: IntentEnvelope ): string[];

export function frameWriteTargets( intent: IntentEnvelope ): string[];
