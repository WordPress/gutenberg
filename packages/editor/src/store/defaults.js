/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export const PREFERENCES_DEFAULTS = {
	insertUsage: {},
	isPublishSidebarEnabled: true,
};

/**
 * The default editor settings
 *
 *  alignWide         boolean        Enable/Disable Wide/Full Alignments
 *  colors            Array          Palette colors
 *  fontSizes         Array          Available font sizes
 *  maxWidth          number         Max width to constraint resizing
 *  blockTypes        boolean|Array  Allowed block types
 *  hasFixedToolbar   boolean        Whether or not the editor toolbar is fixed
 *  focusMode         boolean        Whether the focus mode is enabled or not
 */
export const EDITOR_SETTINGS_DEFAULTS = {
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
			name: __( 'Small' ),
			shortName: __( 'S' ),
			size: 14,
			slug: 'small',
		},
		{
			name: __( 'Regular' ),
			shortName: __( 'M' ),
			size: 16,
			slug: 'regular',
		},
		{
			name: __( 'Large' ),
			shortName: __( 'L' ),
			size: 36,
			slug: 'large',
		},
		{
			name: __( 'Larger' ),
			shortName: __( 'XL' ),
			size: 48,
			slug: 'larger',
		},
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
};
