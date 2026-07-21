/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';

export default function getNavigationMenuLabel( { ref } ) {
	if ( ! ref ) {
		return;
	}

	const core = select( coreStore );
	const entity = {
		kind: 'postType',
		name: 'wp_navigation',
		id: ref,
	};
	const canUpdate = core.canUser( 'update', entity );
	if ( canUpdate === undefined ) {
		return;
	}

	const navigation = canUpdate
		? core.getEditedEntityRecord( 'postType', 'wp_navigation', ref )
		: core.getEntityRecord( 'postType', 'wp_navigation', ref, {
				context: 'view',
		  } );
	const title =
		typeof navigation?.title === 'string'
			? navigation.title
			: navigation?.title?.rendered;

	if ( ! title ) {
		return;
	}

	return decodeEntities( title );
}
