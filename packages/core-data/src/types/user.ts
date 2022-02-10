export interface User {
	/**
	 * Unique identifier for the user.
	 */
	id: number;
	/**
	 * Login name for the user.
	 */
	username?: string;
	/**
	 * Display name for the user.
	 */
	name: string;
	/**
	 * First name for the user.
	 */
	first_name?: string;
	/**
	 * Last name for the user.
	 */
	last_name?: string;
	/**
	 * The email address for the user.
	 */
	email?: string;
	/**
	 * URL of the user.
	 */
	url: string;
	/**
	 * Description of the user.
	 */
	description: string;
	/**
	 * Author URL of the user.
	 */
	link: string;
	/**
	 * Locale for the user.
	 */
	locale?: '' | 'en_US';
	/**
	 * The nickname for the user.
	 */
	nickname?: string;
	/**
	 * An alphanumeric identifier for the user.
	 */
	slug: string;
	/**
	 * Registration date for the user.
	 */
	registered_date?: string;
	/**
	 * Roles assigned to the user.
	 */
	roles?: string[];
	/**
	 * Password for the user (never included).
	 */
	password?: string;
	/**
	 * All capabilities assigned to the user.
	 */
	capabilities?: {
		[ k: string ]: unknown;
	};
	/**
	 * Any extra capabilities assigned to the user.
	 */
	extra_capabilities?: {
		[ k: string ]: unknown;
	};
	/**
	 * Avatar URLs for the user.
	 */
	avatar_urls: {
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
