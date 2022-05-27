/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

export function createListItem( listItemAttributes, listAttributes, children ) {
	return createBlock(
		'core/list-item',
		listItemAttributes,
		! children?.length
			? []
			: [ createBlock( 'core/list', listAttributes, children ) ]
	);
}
