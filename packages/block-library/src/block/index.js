import { symbol as icon } from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';
import { select } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
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
	__experimentalLabel: ( { ref } ) => {
		if ( ! ref ) {
			return;
		}

		const {
			getEditedEntityRecord,
			getEntityRecord,
			hasFinishedResolution,
		} = select( coreStore );
		let title = getEditedEntityRecord( 'postType', 'wp_block', ref )?.title;
		// A user who can't edit the pattern only has its `view` record.
		if (
			! title &&
			hasFinishedResolution( 'getEntityRecord', [
				'postType',
				'wp_block',
				ref,
			] )
		) {
			title = getEntityRecord( 'postType', 'wp_block', ref, {
				context: 'view',
			} )?.title?.raw;
		}
		if ( ! title ) {
			return;
		}

		return decodeEntities( title );
	},
};

export const init = () => initBlock( { name, metadata, settings } );
