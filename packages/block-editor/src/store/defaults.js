/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export const PREFERENCES_DEFAULTS = {
	insertUsage: {},
};

/**
 * The default editor settings
 *
 * @typedef {Object} SETTINGS_DEFAULT
 * @property {boolean} alignWide Enable/Disable Wide/Full Alignments
 * @property {Array} availableLegacyWidgets Array of objects representing the legacy widgets available.
 * @property {boolean} imageEditing Image Editing settings set to false to disable.
 * @property {Array} imageSizes Available image sizes
 * @property {number} maxWidth Max width to constraint resizing
 * @property {boolean|Array} allowedBlockTypes Allowed block types
 * @property {boolean} hasFixedToolbar Whether or not the editor toolbar is fixed
 * @property {boolean} hasPermissionsToManageWidgets Whether or not the user is able to manage widgets.
 * @property {boolean} focusMode Whether the focus mode is enabled or not
 * @property {Array} styles Editor Styles
 * @property {boolean} isRTL Whether the editor is in RTL mode
 * @property {boolean} keepCaretInsideBlock Whether caret should move between blocks in edit mode
 * @property {string} bodyPlaceholder Empty post placeholder
 * @property {string} titlePlaceholder Empty title placeholder
 * @property {boolean} codeEditingEnabled Whether or not the user can switch to the code editor
 * @property {boolean} __experimentalCanUserUseUnfilteredHTML Whether the user should be able to use unfiltered HTML or the HTML should be filtered e.g., to remove elements considered insecure like iframes.
 * @property {boolean} __experimentalBlockDirectory Whether the user has enabled the Block Directory
 * @property {boolean} __experimentalEnableFullSiteEditing Whether the user has enabled Full Site Editing
 * @property {boolean} __experimentalEnableFullSiteEditingDemo Whether the user has enabled Full Site Editing Demo Templates
 * @property {Array} __experimentalBlockPatterns Array of objects representing the block patterns
 * @property {Array} __experimentalBlockPatternCategories Array of objects representing the block pattern categories
 */
export const SETTINGS_DEFAULTS = {
	alignWide: false,

	imageSizes: [
		{ slug: 'thumbnail', name: __( 'Thumbnail' ) },
		{ slug: 'medium', name: __( 'Medium' ) },
		{ slug: 'large', name: __( 'Large' ) },
		{ slug: 'full', name: __( 'Full Size' ) },
	],

	// Allow plugin to disable Image Editor if need be
	imageEditing: true,

	// This is current max width of the block inner area
	// It's used to constraint image resizing and this value could be overridden later by themes
	maxWidth: 580,

	// Allowed block types for the editor, defaulting to true (all supported).
	allowedBlockTypes: true,

	// Maximum upload size in bytes allowed for the site.
	maxUploadFileSize: 0,

	// List of allowed mime types and file extensions.
	allowedMimeTypes: null,

	availableLegacyWidgets: {},
	hasPermissionsToManageWidgets: false,
	__experimentalCanUserUseUnfilteredHTML: false,
	__experimentalBlockDirectory: false,
	__experimentalEnableFullSiteEditing: false,
	__experimentalEnableFullSiteEditingDemo: false,
	__mobileEnablePageTemplates: false,
	__experimentalBlockPatterns: [],
	__experimentalBlockPatternCategories: [],
};
