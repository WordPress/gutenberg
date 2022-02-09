export interface Attachment {
	/**
	 * The date the post was published, in the site's timezone.
	 */
	date?: string | null;
	/**
	 * The date the post was published, as GMT.
	 */
	date_gmt?: string | null;
	/**
	 * The globally unique identifier for the post.
	 */
	guid?: {
		/**
		 * GUID for the post, as it exists in the database.
		 */
		raw?: string;
		/**
		 * GUID for the post, transformed for display.
		 */
		rendered?: string;
	};
	/**
	 * Unique identifier for the post.
	 */
	id?: number;
	/**
	 * URL to the post.
	 */
	link?: string;
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
	slug?: string;
	/**
	 * A named status for the post.
	 */
	status?: '0' | '1' | '2' | '3' | '4';
	/**
	 * Type of post.
	 */
	type?: string;
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
	title?: {
		/**
		 * Title for the post, as it exists in the database.
		 */
		raw?: string;
		/**
		 * HTML title for the post, transformed for display.
		 */
		rendered?: string;
	};
	/**
	 * The ID for the author of the post.
	 */
	author?: number;
	/**
	 * Whether or not comments are open on the post.
	 */
	comment_status?: '0' | '1';
	/**
	 * Whether or not the post can be pinged.
	 */
	ping_status?: '0' | '1';
	/**
	 * Meta fields.
	 */
	meta?: {};
	/**
	 * The theme file to use to display the post.
	 */
	template?: string;
	/**
	 * Alternative text to display when attachment is not displayed.
	 */
	alt_text?: string;
	/**
	 * The attachment caption.
	 */
	caption?: {
		/**
		 * Caption for the attachment, as it exists in the database.
		 */
		raw?: string;
		/**
		 * HTML caption for the attachment, transformed for display.
		 */
		rendered?: string;
	};
	/**
	 * The attachment description.
	 */
	description?: {
		/**
		 * Description for the attachment, as it exists in the database.
		 */
		raw?: string;
		/**
		 * HTML description for the attachment, transformed for display.
		 */
		rendered?: string;
	};
	/**
	 * Attachment type.
	 */
	media_type?: '0' | '1';
	/**
	 * The attachment MIME type.
	 */
	mime_type?: string;
	/**
	 * Details about the media file, specific to its type.
	 */
	media_details?: {};
	/**
	 * The ID for the associated post of the attachment.
	 */
	post?: number;
	/**
	 * URL to the original attachment file.
	 */
	source_url?: string;
	/**
	 * List of the missing image sizes of the attachment.
	 */
	missing_image_sizes?: string[];
}

export interface Comment {
	/**
	 * Unique identifier for the comment.
	 */
	id?: number;
	/**
	 * The ID of the user object, if author was a user.
	 */
	author?: number;
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
	author_name?: string;
	/**
	 * URL for the comment author.
	 */
	author_url?: string;
	/**
	 * User agent for the comment author.
	 */
	author_user_agent?: string;
	/**
	 * The content for the comment.
	 */
	content?: {
		/**
		 * Content for the comment, as it exists in the database.
		 */
		raw?: string;
		/**
		 * HTML content for the comment, transformed for display.
		 */
		rendered?: string;
	};
	/**
	 * The date the comment was published, in the site's timezone.
	 */
	date?: string;
	/**
	 * The date the comment was published, as GMT.
	 */
	date_gmt?: string;
	/**
	 * URL to the comment.
	 */
	link?: string;
	/**
	 * The ID for the parent of the comment.
	 */
	parent?: number;
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
	type?: string;
	/**
	 * Avatar URLs for the comment author.
	 */
	author_avatar_urls?: {
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
	};
	/**
	 * Meta fields.
	 */
	meta?: {};
}

export interface MenuLocation {
	/**
	 * The name of the menu location.
	 */
	name?: string;
	/**
	 * The description of the menu location.
	 */
	description?: string;
	/**
	 * The ID of the assigned menu.
	 */
	menu?: number;
}

export interface NavMenu {
	/**
	 * Unique identifier for the term.
	 */
	id?: number;
	/**
	 * HTML description of the term.
	 */
	description?: string;
	/**
	 * HTML title for the term.
	 */
	name?: string;
	/**
	 * An alphanumeric identifier for the term unique to its type.
	 */
	slug?: string;
	/**
	 * Meta fields.
	 */
	meta?: {};
	/**
	 * The locations assigned to the menu.
	 */
	locations?: string[];
	/**
	 * Whether to automatically add top level pages to this menu.
	 */
	auto_add?: boolean;
}

export interface NavMenuItem {
	/**
	 * The title for the object.
	 */
	title?:
		| string
		| {
				/**
				 * Title for the object, as it exists in the database.
				 */
				raw?: string;
				/**
				 * HTML title for the object, transformed for display.
				 */
				rendered?: string;
		  };
	/**
	 * Unique identifier for the object.
	 */
	id?: number;
	/**
	 * The singular label used to describe this type of menu item.
	 */
	type_label?: string;
	/**
	 * The family of objects originally represented, such as "post_type" or "taxonomy".
	 */
	type?: '0' | '1' | '2' | '3';
	/**
	 * A named status for the object.
	 */
	status?: '0' | '1' | '2' | '3' | '4';
	/**
	 * The ID for the parent of the object.
	 */
	parent?: number;
	/**
	 * Text for the title attribute of the link element for this menu item.
	 */
	attr_title?: string;
	/**
	 * Class names for the link element of this menu item.
	 */
	classes?: string[];
	/**
	 * The description of this menu item.
	 */
	description?: string;
	/**
	 * The DB ID of the nav_menu_item that is this item's menu parent, if any, otherwise 0.
	 */
	menu_order?: number;
	/**
	 * The type of object originally represented, such as "category," "post", or "attachment."
	 */
	object?: string;
	/**
	 * The database ID of the original object this menu item represents, for example the ID for posts or the term_id for categories.
	 */
	object_id?: number;
	/**
	 * The target attribute of the link element for this menu item.
	 */
	target?: '0' | '1';
	/**
	 * The URL to which this menu item points.
	 */
	url?: string;
	/**
	 * The XFN relationship expressed in the link of this menu item.
	 */
	xfn?: string[];
	/**
	 * Whether the menu item represents an object that no longer exists.
	 */
	invalid?: boolean;
	/**
	 * The terms assigned to the object in the nav_menu taxonomy.
	 */
	menus?: number;
	/**
	 * Meta fields.
	 */
	meta?: {};
}

export interface NavigationArea {
	/**
	 * The name of the navigation area.
	 */
	name?: string;
	/**
	 * The description of the navigation area.
	 */
	description?: string;
	/**
	 * The ID of the assigned navigation.
	 */
	navigation?: number;
}

export interface Plugin {
	/**
	 * The plugin file.
	 */
	plugin?: string;
	/**
	 * The plugin activation status.
	 */
	status?: '0' | '1';
	/**
	 * The plugin name.
	 */
	name?: string;
	/**
	 * The plugin's website address.
	 */
	plugin_uri?: string;
	/**
	 * The plugin author.
	 */
	author?: {};
	/**
	 * Plugin author's website address.
	 */
	author_uri?: string;
	/**
	 * The plugin description.
	 */
	description?: {
		/**
		 * The raw plugin description.
		 */
		raw?: string;
		/**
		 * The plugin description formatted for display.
		 */
		rendered?: string;
	};
	/**
	 * The plugin version number.
	 */
	version?: string;
	/**
	 * Whether the plugin can only be activated network-wide.
	 */
	network_only?: boolean;
	/**
	 * Minimum required version of WordPress.
	 */
	requires_wp?: string;
	/**
	 * Minimum required version of PHP.
	 */
	requires_php?: string;
	/**
	 * The plugin's text domain.
	 */
	textdomain?: string;
}

export interface Settings {
	/**
	 * What to show on the front page
	 */
	show_on_front?: string;
	/**
	 * The ID of the page that should be displayed on the front page
	 */
	page_on_front?: number;
	/**
	 * Site title.
	 */
	title?: string;
	/**
	 * Site tagline.
	 */
	description?: string;
	/**
	 * Site URL.
	 */
	url?: string;
	/**
	 * This address is used for admin purposes, like new user notification.
	 */
	email?: string;
	/**
	 * A city in the same timezone as you.
	 */
	timezone?: string;
	/**
	 * A date format for all date strings.
	 */
	date_format?: string;
	/**
	 * A time format for all time strings.
	 */
	time_format?: string;
	/**
	 * A day number of the week that the week should start on.
	 */
	start_of_week?: number;
	/**
	 * WordPress locale code.
	 */
	language?: string;
	/**
	 * Convert emoticons like :-) and :-P to graphics on display.
	 */
	use_smilies?: boolean;
	/**
	 * Default post category.
	 */
	default_category?: number;
	/**
	 * Default post format.
	 */
	default_post_format?: string;
	/**
	 * Blog pages show at most.
	 */
	posts_per_page?: number;
	/**
	 * Allow link notifications from other blogs (pingbacks and trackbacks) on new articles.
	 */
	default_ping_status?: '0' | '1';
	/**
	 * Allow people to submit comments on new posts.
	 */
	default_comment_status?: '0' | '1';
	/**
	 * Site logo.
	 */
	site_logo?: number;
	/**
	 * Site icon.
	 */
	site_icon?: number;
}

export interface Sidebar {
	/**
	 * ID of sidebar.
	 */
	id?: string;
	/**
	 * Unique name identifying the sidebar.
	 */
	name?: string;
	/**
	 * Description of sidebar.
	 */
	description?: string;
	/**
	 * Extra CSS class to assign to the sidebar in the Widgets interface.
	 */
	class?: string;
	/**
	 * HTML content to prepend to each widget's HTML output when assigned to this sidebar. Default is an opening list item element.
	 */
	before_widget?: string;
	/**
	 * HTML content to append to each widget's HTML output when assigned to this sidebar. Default is a closing list item element.
	 */
	after_widget?: string;
	/**
	 * HTML content to prepend to the sidebar title when displayed. Default is an opening h2 element.
	 */
	before_title?: string;
	/**
	 * HTML content to append to the sidebar title when displayed. Default is a closing h2 element.
	 */
	after_title?: string;
	/**
	 * Status of sidebar.
	 */
	status?: '0' | '1';
	/**
	 * Nested widgets.
	 */
	widgets?: ( {} | string )[];
}

export interface Taxonomy {
	/**
	 * All capabilities used by the taxonomy.
	 */
	capabilities?: {};
	/**
	 * A human-readable description of the taxonomy.
	 */
	description?: string;
	/**
	 * Whether or not the taxonomy should have children.
	 */
	hierarchical?: boolean;
	/**
	 * Human-readable labels for the taxonomy for various contexts.
	 */
	labels?: {};
	/**
	 * The title for the taxonomy.
	 */
	name?: string;
	/**
	 * An alphanumeric identifier for the taxonomy.
	 */
	slug?: string;
	/**
	 * Whether or not the term cloud should be displayed.
	 */
	show_cloud?: boolean;
	/**
	 * Types associated with the taxonomy.
	 */
	types?: string[];
	/**
	 * REST base route for the taxonomy.
	 */
	rest_base?: string;
	/**
	 * REST namespace route for the taxonomy.
	 */
	rest_namespace?: string;
	/**
	 * The visibility settings for the taxonomy.
	 */
	visibility?: {
		/**
		 * Whether a taxonomy is intended for use publicly either via the admin interface or by front-end users.
		 */
		public?: boolean;
		/**
		 * Whether the taxonomy is publicly queryable.
		 */
		publicly_queryable?: boolean;
		/**
		 * Whether to generate a default UI for managing this taxonomy.
		 */
		show_ui?: boolean;
		/**
		 * Whether to allow automatic creation of taxonomy columns on associated post-types table.
		 */
		show_admin_column?: boolean;
		/**
		 * Whether to make the taxonomy available for selection in navigation menus.
		 */
		show_in_nav_menus?: boolean;
		/**
		 * Whether to show the taxonomy in the quick/bulk edit panel.
		 */
		show_in_quick_edit?: boolean;
	};
}

export interface Theme {
	/**
	 * The theme's stylesheet. This uniquely identifies the theme.
	 */
	stylesheet?: string;
	/**
	 * The theme's template. If this is a child theme, this refers to the parent theme, otherwise this is the same as the theme's stylesheet.
	 */
	template?: string;
	/**
	 * The theme author.
	 */
	author?: {
		/**
		 * The theme author's name, as found in the theme header.
		 */
		raw?: string;
		/**
		 * HTML for the theme author, transformed for display.
		 */
		rendered?: string;
	};
	/**
	 * The website of the theme author.
	 */
	author_uri?: {
		/**
		 * The website of the theme author, as found in the theme header.
		 */
		raw?: string;
		/**
		 * The website of the theme author, transformed for display.
		 */
		rendered?: string;
	};
	/**
	 * A description of the theme.
	 */
	description?: {
		/**
		 * The theme description, as found in the theme header.
		 */
		raw?: string;
		/**
		 * The theme description, transformed for display.
		 */
		rendered?: string;
	};
	/**
	 * The name of the theme.
	 */
	name?: {
		/**
		 * The theme name, as found in the theme header.
		 */
		raw?: string;
		/**
		 * The theme name, transformed for display.
		 */
		rendered?: string;
	};
	/**
	 * The minimum PHP version required for the theme to work.
	 */
	requires_php?: string;
	/**
	 * The minimum WordPress version required for the theme to work.
	 */
	requires_wp?: string;
	/**
	 * The theme's screenshot URL.
	 */
	screenshot?: string;
	/**
	 * Tags indicating styles and features of the theme.
	 */
	tags?: {
		/**
		 * The theme tags, as found in the theme header.
		 */
		raw?: string[];
		/**
		 * The theme tags, transformed for display.
		 */
		rendered?: string;
	};
	/**
	 * The theme's text domain.
	 */
	textdomain?: string;
	/**
	 * Features supported by this theme.
	 */
	theme_supports?: {
		/**
		 * Whether theme opts in to wide alignment CSS class.
		 */
		'align-wide'?: boolean;
		/**
		 * Whether posts and comments RSS feed links are added to head.
		 */
		'automatic-feed-links'?: boolean;
		/**
		 * Custom background if defined by the theme.
		 */
		'custom-background'?:
			| boolean
			| {
					'default-image'?: string;
					'default-preset'?: '0' | '1' | '2' | '3' | '4';
					'default-position-x'?: '0' | '1' | '2';
					'default-position-y'?: '0' | '1' | '2';
					'default-size'?: '0' | '1' | '2';
					'default-repeat'?: '0' | '1' | '2' | '3';
					'default-attachment'?: '0' | '1';
					'default-color'?: string;
			  };
		/**
		 * Custom header if defined by the theme.
		 */
		'custom-header'?:
			| boolean
			| {
					'default-image'?: string;
					'random-default'?: boolean;
					width?: number;
					height?: number;
					'flex-height'?: boolean;
					'flex-width'?: boolean;
					'default-text-color'?: string;
					'header-text'?: boolean;
					uploads?: boolean;
					video?: boolean;
			  };
		/**
		 * Custom logo if defined by the theme.
		 */
		'custom-logo'?:
			| boolean
			| {
					width?: number;
					height?: number;
					'flex-width'?: boolean;
					'flex-height'?: boolean;
					'header-text'?: string[];
					'unlink-homepage-logo'?: boolean;
			  };
		/**
		 * Whether the theme enables Selective Refresh for Widgets being managed with the Customizer.
		 */
		'customize-selective-refresh-widgets'?: boolean;
		/**
		 * Whether theme opts in to the dark editor style UI.
		 */
		'dark-editor-style'?: boolean;
		/**
		 * Whether the theme disables custom colors.
		 */
		'disable-custom-colors'?: boolean;
		/**
		 * Whether the theme disables custom font sizes.
		 */
		'disable-custom-font-sizes'?: boolean;
		/**
		 * Whether the theme disables custom gradients.
		 */
		'disable-custom-gradients'?: boolean;
		/**
		 * Custom color palette if defined by the theme.
		 */
		'editor-color-palette'?:
			| boolean
			| {
					name?: string;
					slug?: string;
					color?: string;
			  }[];
		/**
		 * Custom font sizes if defined by the theme.
		 */
		'editor-font-sizes'?:
			| boolean
			| {
					name?: string;
					size?: number;
					slug?: string;
			  }[];
		/**
		 * Custom gradient presets if defined by the theme.
		 */
		'editor-gradient-presets'?:
			| boolean
			| {
					name?: string;
					gradient?: string;
					slug?: string;
			  }[];
		/**
		 * Whether theme opts in to the editor styles CSS wrapper.
		 */
		'editor-styles'?: boolean;
		/**
		 * Allows use of HTML5 markup for search forms, comment forms, comment lists, gallery, and caption.
		 */
		html5?: boolean | ( '0' | '1' | '2' | '3' | '4' | '5' | '6' )[];
		/**
		 * Post formats supported.
		 */
		formats?: (
			| 'standard'
			| 'aside'
			| 'chat'
			| 'gallery'
			| 'link'
			| 'image'
			| 'quote'
			| 'status'
			| 'video'
			| 'audio'
		 )[];
		/**
		 * The post types that support thumbnails or true if all post types are supported.
		 */
		'post-thumbnails'?: boolean | string[];
		/**
		 * Whether the theme supports responsive embedded content.
		 */
		'responsive-embeds'?: boolean;
		/**
		 * Whether the theme can manage the document title tag.
		 */
		'title-tag'?: boolean;
		/**
		 * Whether theme opts in to default WordPress block styles for viewing.
		 */
		'wp-block-styles'?: boolean;
	};
	/**
	 * The URI of the theme's webpage.
	 */
	theme_uri?: {
		/**
		 * The URI of the theme's webpage, as found in the theme header.
		 */
		raw?: string;
		/**
		 * The URI of the theme's webpage, transformed for display.
		 */
		rendered?: string;
	};
	/**
	 * The theme's current version.
	 */
	version?: string;
	/**
	 * A named status for the theme.
	 */
	status?: '0' | '1';
}

export interface Type {
	/**
	 * All capabilities used by the post type.
	 */
	capabilities?: {};
	/**
	 * A human-readable description of the post type.
	 */
	description?: string;
	/**
	 * Whether or not the post type should have children.
	 */
	hierarchical?: boolean;
	/**
	 * Whether or not the post type can be viewed.
	 */
	viewable?: boolean;
	/**
	 * Human-readable labels for the post type for various contexts.
	 */
	labels?: {};
	/**
	 * The title for the post type.
	 */
	name?: string;
	/**
	 * An alphanumeric identifier for the post type.
	 */
	slug?: string;
	/**
	 * All features, supported by the post type.
	 */
	supports?: {};
	/**
	 * Taxonomies associated with post type.
	 */
	taxonomies?: string[];
	/**
	 * REST base route for the post type.
	 */
	rest_base?: string;
	/**
	 * REST route's namespace for the post type.
	 */
	rest_namespace?: string;
	/**
	 * The visibility settings for the post type.
	 */
	visibility?: {
		/**
		 * Whether to generate a default UI for managing this post type.
		 */
		show_ui?: boolean;
		/**
		 * Whether to make the post type is available for selection in navigation menus.
		 */
		show_in_nav_menus?: boolean;
	};
}

export interface User {
	/**
	 * Unique identifier for the user.
	 */
	id?: number;
	/**
	 * Login name for the user.
	 */
	username?: string;
	/**
	 * Display name for the user.
	 */
	name?: string;
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
	url?: string;
	/**
	 * Description of the user.
	 */
	description?: string;
	/**
	 * Author URL of the user.
	 */
	link?: string;
	/**
	 * Locale for the user.
	 */
	locale?: '0' | '1' | '2';
	/**
	 * The nickname for the user.
	 */
	nickname?: string;
	/**
	 * An alphanumeric identifier for the user.
	 */
	slug?: string;
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
	capabilities?: {};
	/**
	 * Any extra capabilities assigned to the user.
	 */
	extra_capabilities?: {};
	/**
	 * Avatar URLs for the user.
	 */
	avatar_urls?: {
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
	};
	/**
	 * Meta fields.
	 */
	meta?: {};
}

export interface Widget {
	/**
	 * Unique identifier for the widget.
	 */
	id?: string;
	/**
	 * The type of the widget. Corresponds to ID in widget-types endpoint.
	 */
	id_base?: string;
	/**
	 * The sidebar the widget belongs to.
	 */
	sidebar?: string;
	/**
	 * HTML representation of the widget.
	 */
	rendered?: string;
	/**
	 * HTML representation of the widget admin form.
	 */
	rendered_form?: string;
	/**
	 * Instance settings of the widget, if supported.
	 */
	instance?: {
		/**
		 * Base64 encoded representation of the instance settings.
		 */
		encoded?: string;
		/**
		 * Cryptographic hash of the instance settings.
		 */
		hash?: string;
		/**
		 * Unencoded instance settings, if supported.
		 */
		raw?: {};
	};
	/**
	 * URL-encoded form data from the widget admin form. Used to update a widget that does not support instance. Write only.
	 */
	form_data?: string;
}

export interface WidgetType {
	/**
	 * Unique slug identifying the widget type.
	 */
	id?: string;
	/**
	 * Human-readable name identifying the widget type.
	 */
	name?: string;
	/**
	 * Description of the widget.
	 */
	description?: string;
	/**
	 * Whether the widget supports multiple instances
	 */
	is_multi?: boolean;
	/**
	 * Class name
	 */
	classname?: string;
}

export type EntityRecord =
	| Settings
	| Type
	| Attachment
	| Taxonomy
	| Sidebar
	| Widget
	| WidgetType
	| User
	| Comment
	| NavMenu
	| NavMenuItem
	| MenuLocation
	| NavigationArea
	| Theme
	| Plugin;
