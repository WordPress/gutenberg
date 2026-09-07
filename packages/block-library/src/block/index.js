import { symbol as icon } from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { select } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import initBlock from '../utils/init-block';
import { unlock } from '../lock-unlock';
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
			return entity?.title ? decodeEntities( entity.title ) : undefined;
		}

		if ( slug ) {
			const pattern = unlock(
				select( blockEditorStore )
			).getPatternBySlug( slug );
			return pattern?.title ? decodeEntities( pattern.title ) : undefined;
		}
	},
};

export const init = () => initBlock( { name, metadata, settings } );
