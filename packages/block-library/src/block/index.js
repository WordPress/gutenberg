/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { select } from '@wordpress/data';
import { symbol as icon } from '@wordpress/icons';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';
import save from './save';
import variations from './variations';

const { name } = metadata;

export { metadata, name };

export const settings = {
	edit,
	save,
	icon,
	variations,
	__experimentalLabel: ( { type, slug } ) => {
		// Attempt to find entity title if block is a template part.
		// Require slug to request, otherwise entity is uncreated and will throw 404.
		if ( type !== 'pattern' || ! slug ) {
			return;
		}

		const entity =
			select( blockEditorStore ).__experimentalGetParsedPattern( slug );
		if ( ! entity ) {
			return;
		}

		return entity.title ? decodeEntities( entity.title ) : undefined;
	},
};

export const init = () => initBlock( { name, metadata, settings } );
