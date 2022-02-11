/**
 * Internal dependencies
 */
import {
	edit,
	EntityContext,
	OnlyInContexts,
	FullRawObject,
	RawField,
	view,
	OpenOrClosed,
	DifferentPerContext,
	PostStatus,
	embed,
	RawDataType,
} from './common';

export interface Post<
	Context extends EntityContext,
	RawDataOverride extends RawDataType = RawDataType.default
> {
	/**
	 * The date the post was published, in the site's timezone.
	 */
	date: string | null;
	/**
	 * The date the post was published, as GMT.
	 */
	date_gmt: OnlyInContexts< string | null, view | edit, Context >;
	/**
	 * The globally unique identifier for the post.
	 */
	guid: RawField<
		RawDataOverride,
		DifferentPerContext<
			Pick< FullRawObject, 'rendered' >,
			FullRawObject,
			never,
			Context
		>
	>;
	/**
	 * Unique identifier for the post.
	 */
	id: number;
	/**
	 * URL to the post.
	 */
	link: string;
	/**
	 * The date the post was last modified, in the site's timezone.
	 */
	modified: OnlyInContexts< string, view | edit, Context >;
	/**
	 * The date the post was last modified, as GMT.
	 */
	modified_gmt: OnlyInContexts< string, view | edit, Context >;
	/**
	 * An alphanumeric identifier for the post unique to its type.
	 */
	slug: string;
	/**
	 * A named status for the post.
	 */
	status: OnlyInContexts< PostStatus, view | edit, Context >;
	/**
	 * Type of post.
	 */
	type: string;
	/**
	 * A password to protect access to the content and excerpt.
	 */
	password: OnlyInContexts< string, edit, Context >;
	/**
	 * Permalink template for the post.
	 */
	permalink_template: OnlyInContexts< string, edit, Context >;
	/**
	 * Slug automatically generated from the post title.
	 */
	generated_slug: OnlyInContexts< string, edit, Context >;
	/**
	 * The title for the post.
	 */
	title: RawField<
		RawDataOverride,
		DifferentPerContext<
			Pick< FullRawObject, 'rendered' >,
			FullRawObject,
			Pick< FullRawObject, 'rendered' >,
			Context
		>
	>;
	/**
	 * The content for the post.
	 */
	content: RawField<
		RawDataOverride,
		DifferentPerContext<
			Pick< FullRawObject, 'rendered' > & { protected: boolean },
			FullRawObject & { block_version: number; protected: boolean },
			{ protected: boolean },
			Context
		>
	>;
	/**
	 * The ID for the author of the post.
	 */
	author: number;
	/**
	 * The excerpt for the post.
	 */
	excerpt: RawField<
		RawDataOverride,
		DifferentPerContext<
			Pick< FullRawObject, 'rendered' >,
			FullRawObject,
			Pick< FullRawObject, 'rendered' >,
			Context
		> & { protected: boolean }
	>;
	/**
	 * The ID of the featured media for the post.
	 */
	featured_media: number;
	/**
	 * Whether or not comments are open on the post.
	 */
	comment_status: OnlyInContexts< OpenOrClosed, view | edit, Context >;
	/**
	 * Whether or not the post can be pinged.
	 */
	ping_status: OnlyInContexts< OpenOrClosed, view | edit, Context >;
	/**
	 * The format for the post.
	 */
	format: OnlyInContexts< PostFormat, view | edit, Context >;
	/**
	 * Meta fields.
	 */
	meta: OnlyInContexts<
		{
			[ k: string ]: string;
		},
		view | edit,
		Context
	>;
	/**
	 * Whether or not the post should be treated as sticky.
	 */
	sticky: OnlyInContexts< boolean, view | edit, Context >;
	/**
	 * The theme file to use to display the post.
	 */
	template: OnlyInContexts< string, view | edit, Context >;
	/**
	 * The terms assigned to the post in the category taxonomy.
	 */
	categories: OnlyInContexts< number[], view | edit, Context >;
	/**
	 * The terms assigned to the post in the post_tag taxonomy.
	 */
	tags: OnlyInContexts< number[], view | edit, Context >;
}

type PostFormat =
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
