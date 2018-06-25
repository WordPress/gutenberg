/**
 * WordPress dependencies
 */
import { getCategories } from '@wordpress/blocks';
import { select } from '@wordpress/data';

export const SUGGESTED_PANEL = 'suggested';
export const SHARED_PANEL = 'shared';

/**
 * Returns open panel by default
 *
 * @return {Array} List of panels slugs
 */
export function getDefaultOpenPanels() {
	const isSuggestedVisible = select( 'core/blocks' ).isInserterMenuPanelVisible( SUGGESTED_PANEL );
	const isSharedVisible = select( 'core/blocks' ).isInserterMenuPanelVisible( SUGGESTED_PANEL );

	const categories = getCategories();

	if ( isSuggestedVisible ) {
		return [ SUGGESTED_PANEL ];
	} else if ( isSharedVisible ) {
		return [ SHARED_PANEL ];
	} else if ( categories.length ) {
		return [ categories[ 0 ].slug ];
	}

	return [];
}
