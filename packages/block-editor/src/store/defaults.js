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
 *  alignWide                              boolean       Enable/Disable Wide/Full Alignments
 *  availableLegacyWidgets                 Array         Array of objects representing the legacy widgets available.
 *  colors                                 Array         Palette colors
 *  disableCustomColors                    boolean       Whether or not the custom colors are disabled
 *  fontSizes                              Array         Available font sizes
 *  disableCustomFontSizes                 boolean       Whether or not the custom font sizes are disabled
 *  imageSizes                             Array         Available image sizes
 *  maxWidth                               number        Max width to constraint resizing
 *  allowedBlockTypes                      boolean|Array Allowed block types
 *  hasFixedToolbar                        boolean       Whether or not the editor toolbar is fixed
 *  hasPermissionsToManageWidgets          boolean       Whether or not the user is able to manage widgets.
 *  focusMode                              boolean       Whether the focus mode is enabled or not
 *  styles                                 Array         Editor Styles
 *  isRTL                                  boolean       Whether the editor is in RTL mode
 *  bodyPlaceholder                        string        Empty post placeholder
 *  titlePlaceholder                       string        Empty title placeholder
 *  codeEditingEnabled                     string        Whether or not the user can switch to the code editor
 *  showInserterHelpPanel                  boolean       Whether or not the inserter help panel is shown
 *  __experimentalCanUserUseUnfilteredHTML string        Whether the user should be able to use unfiltered HTML or the HTML should be filtered e.g., to remove elements considered insecure like iframes.
 *  __experimentalEnableLegacyWidgetBlock  boolean       Whether the user has enabled the Legacy Widget Block
 *  __experimentalEnableMenuBlock          boolean       Whether the user has enabled the Menu Block
 *  __experimentalBlockDirectory           boolean       Whether the user has enabled the Block Directory
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
	__experimentalEnableMenuBlock: false,
	__experimentalBlockDirectory: false,
	gradients: [
		{
			name: __( 'Vivid cyan blue to vivid purple' ),
			gradient: 'linear-gradient(135deg, rgba(6, 147, 227, 1) 0%, rgb(155, 81, 224) 100%)',
		},
		{
			name: __( 'Vivid green cyan to vivid cyan blue' ),
			gradient: 'linear-gradient(135deg, rgba(0, 208, 132, 1) 0%, rgba(6, 147, 227, 1) 100%)',
		},
		{
			name: __( 'Light green cyan to vivid green cyan' ),
			gradient: 'linear-gradient(135deg, rgb(122, 220, 180) 0%, rgb(0, 208, 130) 100%)',
		},
		{
			name: __( 'Luminous vivid amber to luminous vivid orange' ),
			gradient: 'linear-gradient(135deg, rgba(252, 185, 0, 1) 0%, rgba(255, 105, 0, 1) 100%)',
		},
		{
			name: __( 'Luminous vivid orange to vivid red' ),
			gradient: 'linear-gradient(135deg, rgba(255, 105, 0, 1) 0%, rgb(207, 46, 46) 100%)',
		},
		{
			name: __( 'Very light gray to cyan bluish gray' ),
			gradient: 'linear-gradient(135deg, rgb(238, 238, 238) 0%, rgb(169, 184, 195)',
		},
		// The following use new, customized colors.
		{
			name: __( 'Cool to warm spectrum' ),
			gradient: 'linear-gradient(135deg, rgb(74, 234, 220), rgb(151, 120, 209), rgb(207, 42, 186), rgb(238, 44, 130), rgb(251, 105, 98),rgb(254, 248, 76)',
		},
		{
			name: __( 'Blush light purple' ),
			gradient: 'linear-gradient(135deg, rgb(255, 206, 236), rgb(152, 150, 240)',
		},
		{
			name: __( 'Blush bordeaux' ),
			gradient: 'linear-gradient(135deg, rgb(254, 205, 165), rgb(254, 45, 45), rgb(107, 0, 62)',
		},
		{
			name: __( 'Purple crush' ),
			gradient: 'linear-gradient(135deg, rgb(52, 226, 228), rgb(71, 33, 251), rgb(171, 29, 254)',
		},
		{
			name: __( 'Luminous dusk' ),
			gradient: 'linear-gradient(135deg, rgb(255, 203, 112), rgb(199, 81, 192), rgb(65, 88, 208)',
		},
		{
			name: __( 'Hazy dawn' ),
			gradient: 'linear-gradient(135deg, rgb(250, 172, 168), rgb(218, 208, 236)',
		},
		{
			name: __( 'Pale ocean' ),
			gradient: 'linear-gradient(135deg, rgb(255, 245, 203), rgb(182, 227, 212), rgb(51, 167, 181)',
		},
		{
			name: __( 'Electric grass' ),
			gradient: 'linear-gradient(135deg, rgb(202, 248, 128), rgb(113, 206, 126)',
		},
		{
			name: __( 'Subdued olive' ),
			gradient: 'linear-gradient(135deg, rgb(250, 250, 225), rgb(103, 166, 113)',
		},
		{
			name: __( 'Atomic cream' ),
			gradient: 'linear-gradient(135deg, rgb(253, 215, 154), rgb(0, 74, 89)',
		},
		{
			name: __( 'Nightshade' ),
			gradient: 'linear-gradient(135deg, rgb(51, 9, 104), rgb(49, 205, 207)',
		},
		{
			name: __( 'Midnight' ),
			gradient: 'linear-gradient(135deg, rgb(2, 3, 129), rgb(40, 116, 252)',
		},
	],
};

