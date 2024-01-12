/**
 * External dependencies
 */
import { capitalCase } from 'change-case';

/**
 * WordPress dependencies
 */
import { layout } from '@wordpress/icons';
import { store as coreDataStore } from '@wordpress/core-data';
import { select } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon: layout,
	__experimentalLabel( { ref } ) {
		if ( ! ref ) return;
		const entity = select( coreDataStore ).getEntityRecord(
			'postType',
			'wp_template',
			ref
		);
		if ( ! entity ) return;
		return (
			decodeEntities( entity.title?.rendered ) ||
			capitalCase( entity.slug )
		);
	},
	edit,
};

export const init = () => initBlock( { name, metadata, settings } );
