/**
 * Shared types for the intent-log engine core.
 *
 * The core modules are JavaScript with generic JSDoc (see the tsconfig
 * exclude note); these hand-written declarations type the surface that
 * TypeScript consumers (the session codec) import. Keep them in lockstep
 * with the implementations — behavior itself is pinned by the jest suites
 * and the frozen cross-language vectors.
 */

export interface FormatSpan {
	start: number;
	end: number;
	format: string;
}

export interface EngineField {
	text: string;
	formats: FormatSpan[];
}

export interface EngineBlock {
	syncId: string;
	blockType: string;
	attrs: Record< string, unknown >;
	attrVersions: Record< string, number >;
	fields: Record< string, EngineField >;
	syncParent: string | null;
	children: EngineBlock[];
}

export interface EngineDocument {
	root: EngineBlock[];
	/** Entity properties (title, excerpt, …); absent until first write. */
	props?: Record< string, unknown >;
	propVersions?: Record< string, number >;
}

export interface IntentEnvelope {
	intentId: string;
	actorId: string;
	baseSeq: number;
	txnId: string | null;
	type: string;
	payload: Record< string, unknown >;
}

export interface IntentDisposition {
	status: 'applied' | 'escalated' | 'voided';
	reason?: string;
}

export interface ClientReplica {
	actorId: string;
	cursor: number;
	online: boolean;
	outbox: IntentEnvelope[];
	nextIntent: number;
	/** Engine seq of log[0] (> 0 after a checkpoint bootstrap or trim). */
	firstSeq: number;
	log: IntentEnvelope[];
	docCache: Map< number, EngineDocument >;
	baseDoc: EngineDocument;
	doc: EngineDocument;
	predictions: Map< string, IntentDisposition >;
}
