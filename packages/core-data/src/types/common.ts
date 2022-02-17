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

export type Context = 'view' | 'edit' | 'embed';
export type ContextualField<
	FieldType,
	AvailableInContexts extends Context,
	C extends Context
> = AvailableInContexts extends C ? FieldType : never;

export type OmitNevers<
	T,
	Nevers = {
		[ K in keyof T ]: Exclude< T[ K ], undefined > extends never
			? never
			: T[ K ] extends Record< string, unknown >
			? OmitNevers< T[ K ] >
			: T[ K ];
	}
> = Pick<
	Nevers,
	{
		[ K in keyof Nevers ]: Nevers[ K ] extends never ? never : K;
	}[ keyof Nevers ]
>;

/**
 * The raw data representation.
 */
export interface RawField< C extends Context > {
	/**
	 * Data as it exists in the database.
	 */
	raw: ContextualField< string, 'edit', C >;
	/**
	 * Data transformed for display.
	 */
	rendered: string;
}
