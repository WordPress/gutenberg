/**
 * The raw data representation.
 */
export interface RawData {
	/**
	 * Data as it exists in the database.
	 */
	raw?: string;
	/**
	 * Data transformed for display.
	 */
	rendered?: string;
}

export type PostStatus = 'publish' | 'future' | 'draft' | 'pending' | 'private';

export type OpenOrClosed = 'open' | 'closed';
export type ActiveOrInactive = 'active' | 'inactive';
