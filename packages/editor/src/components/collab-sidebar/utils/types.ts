/**
 * A note's server id, or `'new'` for the draft marker.
 */
export type NoteId = number | string;

export type BlockAttributes = Record< string, unknown >;

export interface SelectionPoint {
	clientId?: string;
	attributeKey?: string;
	offset?: number;
}

export interface NoteRange {
	start: number;
	end: number;
}

/**
 * Where an inline note's marker sits in a block.
 */
export interface NoteAnchor extends NoteRange {
	attributeKey: string;
}

export interface NoteThread {
	id: NoteId;
	status?: string;
}
