export type WithEdits< T, Fields > = {
	[ Key in keyof T ]: Key extends Fields ? string : T[ Key ];
};

export interface AvatarUrls {
	/**
	 * Avatar URL with image size of 24 pixels.
	 */
	'24'?: string;
	/**
	 * Avatar URL with image size of 48 pixels.
	 */
	'48'?: string;
	/**
	 * Avatar URL with image size of 96 pixels.
	 */
	'96'?: string;

	[ k: string ]: string;
}

export type MediaType = 'image' | 'file';
export type CommentStatus = 'open' | 'closed';
export type PingStatus = 'open' | 'closed';
export type PostStatus = 'publish' | 'future' | 'draft' | 'pending' | 'private';
export type PostFormat =
	| 'standard'
	| 'aside'
	| 'chat'
	| 'gallery'
	| 'link'
	| 'image'
	| 'quote'
	| 'status'
	| 'video'
	| 'audio';

/**
 * The raw data representation.
 */
export interface RawField {
	/**
	 * Data as it exists in the database.
	 */
	raw?: string;
	/**
	 * Data transformed for display.
	 */
	rendered: string;
}
