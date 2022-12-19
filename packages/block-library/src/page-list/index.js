/**
 * WordPress dependencies
 */
import { pages, update } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit.js';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon: ( { context } ) => {
		if ( context === 'list-view' ) {
			return update;
		}

		return pages;
	},
	example: {},
	edit,
};

export const init = () => initBlock( { name, metadata, settings } );
