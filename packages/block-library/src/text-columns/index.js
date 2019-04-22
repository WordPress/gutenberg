/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import metadata from './block.json';
import save from './save';
import transforms from './tranforms';

const { name } = metadata;

export { metadata, name };

export const settings = {
	// Disable insertion as this block is deprecated and ultimately replaced by the Columns block.
	supports: {
		inserter: false,
	},
	title: __( 'Text Columns (deprecated)' ),
	description: __( 'This block is deprecated. Please use the Columns block instead.' ),
	transforms,
	getEditWrapperProps( attributes ) {
		const { width } = attributes;
		if ( 'wide' === width || 'full' === width ) {
			return { 'data-align': width };
		}
	},
	edit,
	save,
};
