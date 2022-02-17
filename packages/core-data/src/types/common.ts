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

export type UpdatableRecord< T, Fields > = {
	[ Key in keyof T ]: Key extends Fields ? string : T[ Key ];
};

type Without<
	T,
	V,
	WithNevers = {
		[ K in keyof T ]: Exclude< T[ K ], undefined > extends V
			? never
			: T[ K ] extends Record< string, unknown >
			? Without< T[ K ], V >
			: T[ K ];
	}
> = Pick<
	WithNevers,
	{
		[ K in keyof WithNevers ]: WithNevers[ K ] extends never ? never : K;
	}[ keyof WithNevers ]
>;

export type WithoutNevers< T > = Without< T, never >;

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
