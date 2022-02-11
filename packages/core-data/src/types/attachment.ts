/**
 * Internal dependencies
 */
import {
	EntityInContext,
	EntityContext,
	EntityRecordWithRawData,
	OpenOrClosed,
	PostStatus,
	RawObject,
	RawString,
} from './common';

type MediaType = 'image' | 'file';

export interface BaseAttachment< RawType > extends EntityRecordWithRawData {
	/**
	 * The date the post was published, in the site's timezone.
	 */
	date: string | null;
	/**
	 * The date the post was published, as GMT.
	 */
	date_gmt: string | null;
	/**
	 * The globally unique identifier for the post.
	 */
	guid: RawType;
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
	modified: string;
	/**
	 * The date the post was last modified, as GMT.
	 */
	modified_gmt: string;
	/**
	 * An alphanumeric identifier for the post unique to its type.
	 */
	slug: string;
	/**
	 * A named status for the post.
	 */
	status: PostStatus;
	/**
	 * Type of post.
	 */
	type: string;
	/**
	 * Permalink template for the post.
	 */
	permalink_template: string;
	/**
	 * Slug automatically generated from the post title.
	 */
	generated_slug: string;
	/**
	 * The title for the post.
	 */
	title: RawType;
	/**
	 * The ID for the author of the post.
	 */
	author: number;
	/**
	 * Whether or not comments are open on the post.
	 */
	comment_status: OpenOrClosed;
	/**
	 * Whether or not the post can be pinged.
	 */
	ping_status: OpenOrClosed;
	/**
	 * Meta fields.
	 */
	meta: {
		[ k: string ]: string;
	};
	/**
	 * The theme file to use to display the post.
	 */
	template: string;
	/**
	 * Alternative text to display when attachment is not displayed.
	 */
	alt_text: string;
	/**
	 * The attachment caption.
	 */
	caption: RawType;
	/**
	 * The attachment description.
	 */
	description: RawType;
	/**
	 * Attachment type.
	 */
	media_type: MediaType;
	/**
	 * The attachment MIME type.
	 */
	mime_type: string;
	/**
	 * Details about the media file, specific to its type.
	 */
	media_details: {
		[ k: string ]: string;
	};
	/**
	 * The ID for the associated post of the attachment.
	 */
	post: number;
	/**
	 * URL to the original attachment file.
	 */
	source_url: string;
	/**
	 * List of the missing image sizes of the attachment.
	 */
	missing_image_sizes: string[];
}

type ViewProperties =
	| 'date'
	| 'date_gmt'
	| 'guid'
	| 'id'
	| 'link'
	| 'modified'
	| 'modified_gmt'
	| 'slug'
	| 'status'
	| 'type'
	| 'title'
	| 'author'
	| 'comment_status'
	| 'ping_status'
	| 'meta'
	| 'template'
	| 'alt_text'
	| 'caption'
	| 'description'
	| 'media_type'
	| 'mime_type'
	| 'media_details'
	| 'post'
	| 'source_url';

type EditProperties =
	| 'date'
	| 'date_gmt'
	| 'guid'
	| 'id'
	| 'link'
	| 'modified'
	| 'modified_gmt'
	| 'slug'
	| 'status'
	| 'type'
	| 'permalink_template'
	| 'generated_slug'
	| 'title'
	| 'author'
	| 'comment_status'
	| 'ping_status'
	| 'meta'
	| 'template'
	| 'alt_text'
	| 'caption'
	| 'description'
	| 'media_type'
	| 'mime_type'
	| 'media_details'
	| 'post'
	| 'source_url'
	| 'missing_image_sizes';

type EmbedProperties =
	| 'date'
	| 'id'
	| 'link'
	| 'slug'
	| 'type'
	| 'title'
	| 'author'
	| 'alt_text'
	| 'caption'
	| 'media_type'
	| 'mime_type'
	| 'media_details'
	| 'source_url';

export type Attachment<
	Context extends EntityContext = EntityContext.view,
	RawType = RawObject< Context >
> = EntityInContext<
	BaseAttachment< RawType >,
	Context,
	ViewProperties,
	EditProperties,
	EmbedProperties
>;

const attachmentInViewContext = ( {} as any ) as Attachment< EntityContext.view >;
// attachmentInViewContext.title is { rendered: string }

const attachmentInEditContext = ( {} as any ) as Attachment< EntityContext.edit >;
// attachmentInEditContext.title is { raw: string, rendered: string }

const attachmentInEmbedContext = ( {} as any ) as Attachment< EntityContext.embed >;
// attachmentInViewContext.title is { rendered: string }

const editedAttachmentRecord = ( {} as any ) as Attachment<
	EntityContext.edit,
	RawString
>;
// editedAttachmentRecord.title is string
