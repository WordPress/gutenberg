/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';

export const PREFERENCES_DEFAULTS = {
	insertUsage: {},
};

/**
 * The default editor settings
 *
 * @typedef {Object} SETTINGS_DEFAULT
 * @property {boolean} alignWide Enable/Disable Wide/Full Alignments
 * @property {Array} availableLegacyWidgets Array of objects representing the legacy widgets available.
 * @property {Array} colors Palette colors
 * @property {boolean} disableCustomColors Whether or not the custom colors are disabled
 * @property {Array} fontSizes Available font sizes
 * @property {boolean} disableCustomFontSizes Whether or not the custom font sizes are disabled
 * @property {Array} imageSizes Available image sizes
 * @property {number} maxWidth Max width to constraint resizing
 * @property {boolean|Array} allowedBlockTypes Allowed block types
 * @property {boolean} hasFixedToolbar Whether or not the editor toolbar is fixed
 * @property {boolean} hasPermissionsToManageWidgets Whether or not the user is able to manage widgets.
 * @property {boolean} focusMode Whether the focus mode is enabled or not
 * @property {Array} styles Editor Styles
 * @property {boolean} isRTL Whether the editor is in RTL mode
 * @property {string} bodyPlaceholder Empty post placeholder
 * @property {string} titlePlaceholder Empty title placeholder
 * @property {boolean} codeEditingEnabled Whether or not the user can switch to the code editor
 * @property {boolean} showInserterHelpPanel Whether or not the inserter help panel is shown
 * @property {boolean} __experimentalCanUserUseUnfilteredHTML Whether the user should be able to use unfiltered HTML or the HTML should be filtered e.g., to remove elements considered insecure like iframes.
 * @property {boolean} __experimentalEnableLegacyWidgetBlock Whether the user has enabled the Legacy Widget Block
 * @property {boolean} __experimentalBlockDirectory Whether the user has enabled the Block Directory
 * @property {boolean} __experimentalEnableFullSiteEditing Whether the user has enabled Full Site Editing
 * @property {boolean} __experimentalEnableFullSiteEditingDemo Whether the user has enabled Full Site Editing Demo Templates
 * @property {boolean} __experimentalEnablePageTemplates Whether the user has enabled the Page Templates
 */
export const SETTINGS_DEFAULTS = {
	alignWide: false,
	colors: [
		{
			name: __( 'Pale pink' ),
			slug: 'pale-pink',
			color: '#f78da7',
		},
		{	name: __( 'Vivid red' ),
			slug: 'vivid-red',
			color: '#cf2e2e',
		},
		{
			name: __( 'Luminous vivid orange' ),
			slug: 'luminous-vivid-orange',
			color: '#ff6900',
		},
		{
			name: __( 'Luminous vivid amber' ),
			slug: 'luminous-vivid-amber',
			color: '#fcb900',
		},
		{
			name: __( 'Light green cyan' ),
			slug: 'light-green-cyan',
			color: '#7bdcb5',
		},
		{
			name: __( 'Vivid green cyan' ),
			slug: 'vivid-green-cyan',
			color: '#00d084',
		},
		{
			name: __( 'Pale cyan blue' ),
			slug: 'pale-cyan-blue',
			color: '#8ed1fc',
		},
		{
			name: __( 'Vivid cyan blue' ),
			slug: 'vivid-cyan-blue',
			color: '#0693e3',
		},
		{
			name: __( 'Vivid purple' ),
			slug: 'vivid-purple',
			color: '#9b51e0',
		},
		{
			name: __( 'Very light gray' ),
			slug: 'very-light-gray',
			color: '#eeeeee',
		},
		{
			name: __( 'Cyan bluish gray' ),
			slug: 'cyan-bluish-gray',
			color: '#abb8c3',
		},
		{
			name: __( 'Very dark gray' ),
			slug: 'very-dark-gray',
			color: '#313131',
		},
	],

	fontSizes: [
		{
			name: _x( 'Small', 'font size name' ),
			size: 13,
			slug: 'small',
		},
		{
			name: _x( 'Normal', 'font size name' ),
			size: 16,
			slug: 'normal',
		},
		{
			name: _x( 'Medium', 'font size name' ),
			size: 20,
			slug: 'medium',
		},
		{
			name: _x( 'Large', 'font size name' ),
			size: 36,
			slug: 'large',
		},
		{
			name: _x( 'Huge', 'font size name' ),
			size: 48,
			slug: 'huge',
		},
	],

	imageSizes: [
		{ slug: 'thumbnail', label: __( 'Thumbnail' ) },
		{ slug: 'medium', label: __( 'Medium' ) },
		{ slug: 'large', label: __( 'Large' ) },
		{ slug: 'full', label: __( 'Full Size' ) },
	],

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
	showInserterHelpPanel: true,
	__experimentalCanUserUseUnfilteredHTML: false,
	__experimentalEnableLegacyWidgetBlock: false,
	__experimentalBlockDirectory: false,
	__experimentalEnableFullSiteEditing: false,
	__experimentalEnableFullSiteEditingDemo: false,
	__experimentalEnablePageTemplates: false,
	gradients: [
		{
			name: __( 'Vivid cyan blue to vivid purple' ),
			gradient: 'linear-gradient(135deg,rgba(6,147,227,1) 0%,rgb(155,81,224) 100%)',
			slug: 'vivid-cyan-blue-to-vivid-purple',
		},
		{
			name: __( 'Light green cyan to vivid green cyan' ),
			gradient: 'linear-gradient(135deg,rgb(122,220,180) 0%,rgb(0,208,130) 100%)',
			slug: 'light-green-cyan-to-vivid-green-cyan',
		},
		{
			name: __( 'Luminous vivid amber to luminous vivid orange' ),
			gradient: 'linear-gradient(135deg,rgba(252,185,0,1) 0%,rgba(255,105,0,1) 100%)',
			slug: 'luminous-vivid-amber-to-luminous-vivid-orange',
		},
		{
			name: __( 'Luminous vivid orange to vivid red' ),
			gradient: 'linear-gradient(135deg,rgba(255,105,0,1) 0%,rgb(207,46,46) 100%)',
			slug: 'luminous-vivid-orange-to-vivid-red',
		},
		{
			name: __( 'Very light gray to cyan bluish gray' ),
			gradient: 'linear-gradient(135deg,rgb(238,238,238) 0%,rgb(169,184,195) 100%)',
			slug: 'very-light-gray-to-cyan-bluish-gray',
		},
		{
			name: __( 'Cool to warm spectrum' ),
			gradient: 'linear-gradient(135deg,rgb(74,234,220) 0%,rgb(151,120,209) 20%,rgb(207,42,186) 40%,rgb(238,44,130) 60%,rgb(251,105,98) 80%,rgb(254,248,76) 100%)',
			slug: 'cool-to-warm-spectrum',
		},
		{
			name: __( 'Blush light purple' ),
			gradient: 'linear-gradient(135deg,rgb(255,206,236) 0%,rgb(152,150,240) 100%)',
			slug: 'blush-light-purple',
		},
		{
			name: __( 'Blush bordeaux' ),
			gradient: 'linear-gradient(135deg,rgb(254,205,165) 0%,rgb(254,45,45) 50%,rgb(107,0,62) 100%)',
			slug: 'blush-bordeaux',
		},
		{
			name: __( 'Luminous dusk' ),
			gradient: 'linear-gradient(135deg,rgb(255,203,112) 0%,rgb(199,81,192) 50%,rgb(65,88,208) 100%)',
			slug: 'luminous-dusk',
		},
		{
			name: __( 'Pale ocean' ),
			gradient: 'linear-gradient(135deg,rgb(255,245,203) 0%,rgb(182,227,212) 50%,rgb(51,167,181) 100%)',
			slug: 'pale-ocean',
		},
		{
			name: __( 'Electric grass' ),
			gradient: 'linear-gradient(135deg,rgb(202,248,128) 0%,rgb(113,206,126) 100%)',
			slug: 'electric-grass',
		},
		{
			name: __( 'Midnight' ),
			gradient: 'linear-gradient(135deg,rgb(2,3,129) 0%,rgb(40,116,252) 100%)',
			slug: 'midnight',
		},
	],
};
