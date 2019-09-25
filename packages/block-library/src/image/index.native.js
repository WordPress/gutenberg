/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { settings as webSettings } from './index.js';

export { metadata, name } from './index.js';

export const settings = {
	...webSettings,
	__experimentalGetAccessibilityLabel( attributes ) {
		const { caption, alt, url } = attributes;

		if ( ! url ) {
			return __( 'Empty' );
		}

		if ( ! alt ) {
			return caption || '';
		}

		// This is intended to be read by a screen reader.
		// A period simply means a pause, no need to translate it.
		return alt + ( caption ? '. ' + caption : '' );
	},
};
