/**
 * Internal dependencies
 */
import type {
	Context,
	ContextualField,
	MediaType,
	PostStatus,
	RenderedText,
	OmitNevers,
	CommentingStatus,
	PingStatus,
} from './helpers';

import type { BaseEntityRecords as _BaseEntityRecords } from './base-entity-records';

interface MediaDetails {
	width: number;
	height: number;
	file: string;
	filesize: number;
	sizes: { [ key: string ]: Size };
	image_meta: ImageMeta;
	original_image?: string;
}
interface ImageMeta {
	aperture: string;
	credit: string;
	camera: string;
	caption: string;
	created_timestamp: string;
	copyright: string;
	focal_length: string;
	iso: string;
	shutter_speed: string;
	title: string;
	orientation: string;
	keywords: any[];
}

interface Size {
	file: string;
	width: number;
	height: number;
	filesize?: number;
	mime_type: string;
	source_url: string;
	uncropped?: boolean;
}

declare module './base-entity-records' {
	export namespace BaseEntityRecords {
		export interface Attachment< C extends Context > {
			/**
			 * The date the post was published, in the site's timezone.
			 */
			date: string | null;
			/**
			 * The date the post was published, as GMT.
			 */
			date_gmt: ContextualField< string | null, 'view' | 'edit', C >;
			/**
			 * The globally unique identifier for the post.
			 */
			guid: ContextualField< RenderedText< C >, 'view' | 'edit', C >;
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
			modified: ContextualField< string, 'view' | 'edit', C >;
			/**
			 * The date the post was last modified, as GMT.
			 */
			modified_gmt: ContextualField< string, 'view' | 'edit', C >;
			/**
			 * An alphanumeric identifier for the post unique to its type.
			 */
			slug: string;
			/**
			 * A named status for the post.
			 */
			status: ContextualField< PostStatus, 'view' | 'edit', C >;
			/**
			 * Type of post.
			 */
			type: string;
			/**
			 * Permalink template for the post.
			 */
			permalink_template: ContextualField< string, 'edit', C >;
			/**
			 * Slug automatically generated from the post title.
			 */
			generated_slug: ContextualField< string, 'edit', C >;
			/**
			 * The title for the post.
			 */
			title: RenderedText< C >;
			/**
			 * The ID for the author of the post.
			 */
			author: number;
			/**
			 * Whether or not comments are open on the post.
			 */
			comment_status: ContextualField<
				CommentingStatus,
				'view' | 'edit',
				C
			>;
			/**
			 * Whether or not the post can be pinged.
			 */
			ping_status: ContextualField< PingStatus, 'view' | 'edit', C >;
			/**
			 * Meta fields.
			 */
			meta: ContextualField<
				Record< string, string >,
				'view' | 'edit',
				C
			>;
			/**
			 * The theme file to use to display the post.
			 */
			template: ContextualField< string, 'view' | 'edit', C >;
			/**
			 * Alternative text to display when attachment is not displayed.
			 */
			alt_text: string;
			/**
			 * The attachment caption.
			 */
			caption: ContextualField< string, 'edit', C >;
			/**
			 * The attachment description.
			 */
			description: ContextualField<
				RenderedText< C >,
				'view' | 'edit',
				C
			>;
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
			media_details: MediaDetails;
			/**
			 * The ID for the associated post of the attachment.
			 */
			post: ContextualField< number, 'view' | 'edit', C >;
			/**
			 * URL to the original attachment file.
			 */
			source_url: string;
			/**
			 * List of the missing image sizes of the attachment.
			 */
			missing_image_sizes: ContextualField< string[], 'edit', C >;
		}
	}
}

export type Attachment< C extends Context = 'edit' > = OmitNevers<
	_BaseEntityRecords.Attachment< C >
>;
