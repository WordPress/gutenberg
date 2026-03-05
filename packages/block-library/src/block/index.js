/**
 * WordPress dependencies
 */
import { symbol as icon } from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';
import { select } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';
import deprecated from './deprecated';

const { name } = metadata;

export { metadata, name };

export const settings = {
	deprecated,
	edit,
	icon,
	__experimentalLabel: ( { ref, slug } ) => {
		if ( ref ) {
			const entity = select( coreStore ).getEditedEntityRecord(
				'postType',
				'wp_block',
				ref
			);
			if ( entity?.title ) {
				return decodeEntities( entity.title );
			}
		}

		if ( slug ) {
			const pattern =
				select( blockEditorStore ).__experimentalGetParsedPattern(
					slug
				);
			if ( pattern?.title ) {
				return decodeEntities( pattern.title );
			}
		}
	},
};

export const init = () => initBlock( { name, metadata, settings } );
