/**
 * Internal dependencies
 */
import { EntityRecordWithRawData, OpenOrClosed, PostStatus } from './common';

type MediaType = 'image' | 'file';

export interface Attachment< RawType > extends EntityRecordWithRawData {
	/**
	 * The date the post was published, in the site's timezone.
	 */
	date: string | null;
	/**
	 * The date the post was published, as GMT.
	 */
	date_gmt?: string | null;
	/**
	 * The globally unique identifier for the post.
	 */
	guid?: RawType;
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
	modified?: string;
	/**
	 * The date the post was last modified, as GMT.
	 */
	modified_gmt?: string;
	/**
	 * An alphanumeric identifier for the post unique to its type.
	 */
	slug: string;
	/**
	 * A named status for the post.
	 */
	status?: PostStatus;
	/**
	 * Type of post.
	 */
	type: string;
	/**
	 * Permalink template for the post.
	 */
	permalink_template?: string;
	/**
	 * Slug automatically generated from the post title.
	 */
	generated_slug?: string;
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
	comment_status?: OpenOrClosed;
	/**
	 * Whether or not the post can be pinged.
	 */
	ping_status?: OpenOrClosed;
	/**
	 * Meta fields.
	 */
	meta?: {
		[ k: string ]: string;
	};
	/**
	 * The theme file to use to display the post.
	 */
	template?: string;
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
	description?: RawType;
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
	post?: number;
	/**
	 * URL to the original attachment file.
	 */
	source_url: string;
	/**
	 * List of the missing image sizes of the attachment.
	 */
	missing_image_sizes?: string[];
}
