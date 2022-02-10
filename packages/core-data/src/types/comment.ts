export interface Comment {
	/**
	 * Unique identifier for the comment.
	 */
	id: number;
	/**
	 * The ID of the user object, if author was a user.
	 */
	author: number;
	/**
	 * Email address for the comment author.
	 */
	author_email?: string;
	/**
	 * IP address for the comment author.
	 */
	author_ip?: string;
	/**
	 * Display name for the comment author.
	 */
	author_name: string;
	/**
	 * URL for the comment author.
	 */
	author_url: string;
	/**
	 * User agent for the comment author.
	 */
	author_user_agent?: string;
	/**
	 * The content for the comment.
	 */
	content: RawData;
	/**
	 * The date the comment was published, in the site's timezone.
	 */
	date: string;
	/**
	 * The date the comment was published, as GMT.
	 */
	date_gmt?: string;
	/**
	 * URL to the comment.
	 */
	link: string;
	/**
	 * The ID for the parent of the comment.
	 */
	parent: number;
	/**
	 * The ID of the associated post object.
	 */
	post?: number;
	/**
	 * State of the comment.
	 */
	status?: string;
	/**
	 * Type of the comment.
	 */
	type: string;
	/**
	 * Avatar URLs for the comment author.
	 */
	author_avatar_urls: {
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
		[ k: string ]: unknown;
	};
	/**
	 * Meta fields.
	 */
	meta?: {
		[ k: string ]: unknown;
	};
}

/**
 * The raw data representation.
 */
export interface RawData {
	/**
	 * Data as it exists in the database.
	 */
	raw?: string;
	/**
	 * Data transformed for display.
	 */
	rendered?: string;
}
