/**
 * WordPress dependencies
 */
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export const MODAL_TABS = [
	{
		name: 'installed-fonts',
		title: __( 'Library' ),
		className: 'installed-fonts',
	},
	{
		name: 'local-fonts',
		title: __( 'Upload' ),
		className: 'local-fonts',
	},
];

export const DEMO_TEXT = __(
	'Incredible as it may seem, I believe that the Aleph of Garay Street was a false Aleph'
);

export const DEFAULT_DEMO_CONFIG = {
	text: '',
	fontSize: 24,
};

export const ALLOWED_FILE_EXTENSIONS = [ 'otf', 'ttf', 'woff', 'woff2' ];
