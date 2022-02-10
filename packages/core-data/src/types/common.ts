/**
 * The raw data representation.
 */
export interface RawObject {
	/**
	 * Data as it exists in the database.
	 */
	raw?: string;
	/**
	 * Data transformed for display.
	 */
	rendered?: string;
}

export type RawString = string;
export type RawData = RawObject | RawString;

export type PostStatus = 'publish' | 'future' | 'draft' | 'pending' | 'private';

export type OpenOrClosed = 'open' | 'closed';
export type ActiveOrInactive = 'active' | 'inactive';

export type TemplateContent =
	| {
			/**
			 * Content for the template, as it exists in the database.
			 */
			raw?: string;
			/**
			 * Version of the content block format used by the template.
			 */
			block_version?: number;
	  }
	| string;

export interface EntityRecordWithRawData<
	RawType extends RawData = RawObject
> {}
