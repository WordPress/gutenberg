/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { create } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { settings as webSettings } from './index.js';

export { metadata, name } from './index.js';

export const settings = {
	...webSettings,
	__experimentalGetAccessibilityLabel( attributes ) {
		const { content } = attributes;

		const plainTextContent = ( html ) => create( { html } ).text || '';

		return isEmpty( content ) ? __( 'Empty' ) : plainTextContent( content );
	},
};
