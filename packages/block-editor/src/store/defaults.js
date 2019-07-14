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
 *  __experimentalCanUserUseUnfilteredHTML string        Whether the user should be able to use unfiltered HTML or the HTML should be filtered e.g., to remove elements considered insecure like iframes.
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
	__experimentalCanUserUseUnfilteredHTML: false,
};

