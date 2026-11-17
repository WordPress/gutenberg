import { select } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';

interface NavigationAttributes {
	ref?: number;
}

/**
 * Returns the title of the Navigation Menu used by a Navigation block, for
 * use as the block's label.
 *
 * @param attributes     Navigation block attributes.
 * @param attributes.ref ID of the Navigation Menu.
 * @return The decoded menu title, or undefined if it is not available yet.
 */
export default function getNavigationMenuLabel( {
	ref,
}: NavigationAttributes ): string | undefined {
	if ( ! ref ) {
		return undefined;
	}

	const { canUser, getEditedEntityRecord, getEntityRecord } =
		select( coreStore );
	const canUpdate = canUser( 'update', {
		kind: 'postType',
		name: 'wp_navigation',
		id: ref,
	} );
	if ( canUpdate === undefined ) {
		return undefined;
	}

	// A user who cannot update the menu can only load it in view context,
	// where the title is an object holding only the rendered value.
	let title: string | undefined;
	if ( canUpdate ) {
		// The edited record flattens raw attributes such as `title` to strings.
		const navigation = getEditedEntityRecord(
			'postType',
			'wp_navigation',
			ref
		) as { title?: string } | false;
		title = navigation ? navigation.title : undefined;
	} else {
		title = getEntityRecord( 'postType', 'wp_navigation', ref, {
			context: 'view',
		} )?.title?.rendered;
	}

	if ( ! title ) {
		return undefined;
	}

	return decodeEntities( title );
}
