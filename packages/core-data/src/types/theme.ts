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
	author?: RawData;
	/**
	 * The website of the theme author.
	 */
	author_uri?: RawData;
	/**
	 * A description of the theme.
	 */
	description?: RawData;
	/**
	 * The name of the theme.
	 */
	name?: RawData;
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
	tags?: RawData;
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
					'default-preset'?:
						| 'default'
						| 'fill'
						| 'fit'
						| 'repeat'
						| 'custom';
					'default-position-x'?: 'left' | 'center' | 'right';
					'default-position-y'?: 'left' | 'center' | 'right';
					'default-size'?: 'auto' | 'contain' | 'cover';
					'default-repeat'?:
						| 'repeat-x'
						| 'repeat-y'
						| 'repeat'
						| 'no-repeat';
					'default-attachment'?: 'scroll' | 'fixed';
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
		html5?:
			| boolean
			| (
					| 'search-form'
					| 'comment-form'
					| 'comment-list'
					| 'gallery'
					| 'caption'
					| 'script'
					| 'style'
			   )[];
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
		[ k: string ]: unknown;
	};
	/**
	 * The URI of the theme's webpage.
	 */
	theme_uri?: RawData;
	/**
	 * The theme's current version.
	 */
	version?: string;
	/**
	 * A named status for the theme.
	 */
	status?: 'inactive' | 'active';
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
