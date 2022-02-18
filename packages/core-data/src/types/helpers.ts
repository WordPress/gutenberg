/**
 * Internal dependencies
 */
import { WpTemplate } from './wp-template';
import { WpTemplatePart } from './wp-template-part';
import { EntityRecord } from './index';

export interface AvatarUrls {
	/**
	 * Avatar URL with image size of 24 pixels.
	 */
	'24': string;
	/**
	 * Avatar URL with image size of 48 pixels.
	 */
	'48': string;
	/**
	 * Avatar URL with image size of 96 pixels.
	 */
	'96': string;
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
 * The REST API context parameter.
 */
export type Context = 'view' | 'edit' | 'embed';

/**
 * A wrapper that turns fields unavailable in the current REST API contexts into
 * the type `never`. It is typically paired with OmitNevers.
 *
 * @example
 * ```ts
 * type MyType< C extends Context > = {
 *   good: ContextualField< string, 'view' | 'edit', C >;
 *   bad: ContextualField< string, 'edit', C >;
 * }
 *
 * const a = {} as MyType<'view'>;
 * // a.good is of type string
 * // b.bad is of type never
 *
 * const b = {} as OmitNevers<MyType<'view'>>;
 * // a.good is of type string
 * // there is no property b.bad
 * ```
 */
export type ContextualField<
	FieldType,
	AvailableInContexts extends Context,
	C extends Context
> = AvailableInContexts extends C ? FieldType : never;

/**
 * Removes all the properties of type never, even the deeply nested ones.
 *
 * @example
 * ```ts
 * type MyType = {
 *   foo: string;
 *   bar: never;
 *   nested: {
 *     foo: string;
 *     bar: never;
 *   }
 * }
 * const x = {} as OmitNevers<MyType>;
 * // x is of type { foo: string; nested: { foo: string; }}
 * // The `never` properties were removed entirely
 * ```
 */
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
 * A string that the server renders which often involves
 * modifications from the raw source string.
 *
 * For example, block HTML with the comment delimiters exists
 * in `post_content` but those comments are stripped out when
 * rendering to a page view. Similarly, plugins might modify
 * content or replace shortcodes.
 */
export interface RenderedText< C extends Context > {
	/**
	 * The source string which will be rendered on page views.
	 */
	raw: ContextualField< string, 'edit', C >;
	/**
	 * The output of the raw source after processing and filtering on the server.
	 */
	rendered: string;
}

/**
 * Updatable<EntityRecord> is a type describing Edited Entity Records. They are like
 * regular Entity Records, but they have all the local edits applied on top of the REST API data.
 *
 * This turns certain field from an object into a string.
 *
 * Entities like Post have fields that only be rendered on the server, like title, excerpt,
 * and content. The REST API exposes both the raw markup and the rendered version of those fields.
 * For example, in the block editor, content.rendered could used as a visual preview, and
 * content.raw could be used to populate the code editor.
 *
 * When updating these rendered fields, Javascript is not be able to properly render arbitrary block
 * markup. Therefore, it stores only the raw markup without the rendered part. And since that's a string,
 * the entire field becomes a string.
 *
 * @example
 * ```ts
 * type Post< C extends Context > {
 *   title: RenderedText< C >;
 * }
 * const post = {} as Post;
 * // post.title is an object with raw and rendered properties
 *
 * const updatablePost = {} as Updatable< Post >;
 * // updatablePost.title is a string
 * ```
 */
export type Updatable< T extends EntityRecord< 'edit' > > = {
	[ K in keyof T ]: T[ K ] extends RenderedText< any >
		? string
		: /*
		 * Explicit handling for WpTemplate and WpTemplatePart. They both have a
		 * `content` field that needs to be collapsed into a string even though
		 * it doesn't match the RenderedText signature.
		 */
		T extends WpTemplate< any > | WpTemplatePart< any >
		? K extends 'content'
			? string
			: T[ K ]
		: T[ K ];
};
