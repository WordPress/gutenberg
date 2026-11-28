/**
 * A note's server id, or `'new'` for the draft marker.
 */
export type NoteId = number | string;

/**
 * Looser than the block editor's `BlockAttributes`, which isn't exported.
 */
export type BlockAttributes = Record< string, unknown >;

/**
 * The block editor's `BlockSelection`, which isn't exported.
 */
export interface BlockSelection {
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
