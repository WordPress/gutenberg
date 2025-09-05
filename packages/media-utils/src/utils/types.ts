/**
 * A media attachment object in a REST API context.
 *
 * Simplified version of what's defined in the wp-types package.
 *
 * @see https://www.npmjs.com/package/wp-types
 */
interface WP_REST_API_Attachment {
	/**
	 * Unique identifier for the attachment.
	 */
	id: number;
	/**
	 * The ID of the featured media for the post.
	 */
	featured_media: number;
	/**
	 * URL to the attachment.
	 */
	link: string;
	/**
	 * The date the attachment was published, in the site's timezone.
	 */
	date: string;
	/**
	 * The date the attachment was published, as GMT.
	 */
	date_gmt: string;
	/**
	 * The date the attachment was last modified, in the site's timezone.
	 */
	modified: string;
	/**
	 * The date the attachment was last modified, as GMT.
	 */
	modified_gmt: string;
	/**
	 * An alphanumeric identifier for the attachment unique to its type.
	 */
	slug: string;
	/**
	 * A named status for the attachment.
	 */
	status: string;
	/**
	 * Type of Post for the attachment.
	 */
	type: 'attachment';
	/**
	 * Alternative text to display when attachment is not displayed.
	 */
	alt_text: string;
	/**
	 * The attachment caption.
	 */
	caption: {
		/**
		 * Caption for the attachment, as it exists in the database. Only present when using the 'edit' context.
		 */
		raw?: string;
		/**
		 * HTML caption for the attachment, transformed for display.
		 */
		rendered: string;
	};
	/**
	 * The attachment description.
	 */
	description: {
		/**
		 * Description for the attachment, as it exists in the database. Only present when using the 'edit' context.
		 */
		raw?: string;
		/**
		 * HTML description for the attachment, transformed for display.
		 */
		rendered: string;
	};
	/**
	 * Attachment type.
	 */
	media_type: 'image' | 'file';
	/**
	 * The attachment MIME type.
	 */
	mime_type: string;
	/**
	 * Details about the media file, specific to its type.
	 */
	media_details: {
		[ k: string ]: unknown;
	};
	/**
	 * The ID for the associated post of the attachment.
	 */
	post: number | null;
	/**
	 * URL to the original attachment file.
	 */
	source_url: string;
	/**
	 * List of the missing image sizes of the attachment.  Only present when using the 'edit' context.
	 */
	missing_image_sizes?: string[];
	/**
	 * Permalink template for the attachment. Only present when using the 'edit' context and the post type is public.
	 */
	permalink_template?: string;
	/**
	 * Slug automatically generated from the attachment title. Only present when using the 'edit' context and the post type is public.
	 */
	generated_slug?: string;
	/**
	 * An array of the class names for the post container element.
	 */
	class_list: string[];
	/**
	 * The title for the attachment.
	 */
	title: {
		/**
		 * Title for the attachment, as it exists in the database. Only present when using the 'edit' context.
		 */
		raw?: string;
		/**
		 * HTML title for the attachment, transformed for display.
		 */
		rendered: string;
	};
	/**
	 * The ID for the author of the attachment.
	 */
	author: number;
	/**
	 * Whether or not comments are open on the attachment.
	 */
	comment_status: string;
	/**
	 * Whether or not the attachment can be pinged.
	 */
	ping_status: string;
	/**
	 * Meta fields.
	 */
	meta:
		| []
		| {
				[ k: string ]: unknown;
		  };
	/**
	 * The theme file to use to display the attachment.
	 */
	template: string;
	_links: {
		[ k: string ]: {
			href: string;
			embeddable?: boolean;
			[ k: string ]: unknown;
		}[];
	};
	/**
	 * The embedded representation of relations. Only present when the '_embed' query parameter is set.
	 */
	_embedded?: {
		/**
		 * The author of the post.
		 */
		author: unknown[];
		/**
		 * The featured image post.
		 */
		'wp:featuredmedia'?: WP_REST_API_Attachment[];
		[ k: string ]: unknown;
	};
	[ k: string ]: unknown;
}

/**
 * REST API attachment object with additional fields added by this project.
 */
export interface RestAttachment extends WP_REST_API_Attachment {}

type BetterOmit< T, K extends PropertyKey > = {
	[ P in keyof T as P extends K ? never : P ]: T[ P ];
};

/**
 * Transformed attachment object.
 */
export type Attachment = BetterOmit<
	RestAttachment,
	'alt_text' | 'source_url' | 'caption' | 'title'
> & {
	alt: WP_REST_API_Attachment[ 'alt_text' ];
	caption: WP_REST_API_Attachment[ 'caption' ][ 'raw' ] & string;
	title: WP_REST_API_Attachment[ 'title' ][ 'raw' ];
	url: WP_REST_API_Attachment[ 'source_url' ];
	poster?: WP_REST_API_Attachment[ 'source_url' ];
};

export type OnChangeHandler = ( attachments: Partial< Attachment >[] ) => void;
export type OnErrorHandler = ( error: Error ) => void;

export type CreateRestAttachment = Partial< RestAttachment >;

export type AdditionalData = BetterOmit< CreateRestAttachment, 'meta' >;

export interface CreateSideloadFile {
	image_size?: string;
	upload_request?: string;
}

export interface SideloadAdditionalData {
	post: RestAttachment[ 'id' ];
	image_size?: string;
}
