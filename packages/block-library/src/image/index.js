/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { image as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import deprecated from './deprecated';
import edit from './edit';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	__experimentalLabel( attributes, { context } ) {
		if ( context === 'accessibility' ) {
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
		}
	},
	getEditWrapperProps( attributes ) {
		return {
			'data-align': attributes.align,
		};
	},
	transforms,
	edit,
	save,
	deprecated,
};

export const init = () => initBlock( { name, metadata, settings } );
