/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useLocation } = unlock( routerPrivateApis );

// Used on PagePages and PageTemplates.
export function usePostIdLinkInSelection(
	selection,
	setSelection,
	isLoadingItems,
	items
) {
	const {
		params: { postId },
	} = useLocation();
	const [ postIdToSelect, setPostIdToSelect ] = useState( postId );
	useEffect( () => {
		if ( postId ) {
			setPostIdToSelect( postId );
		}
	}, [ postId ] );

	useEffect( () => {
		if ( ! postIdToSelect ) {
			return;
		}
		// Only try to select an item if the loading is complete and we have items.
		if ( ! isLoadingItems && items && items.length ) {
			// If the item is not in the current selection, select it.
			if ( selection.length !== 1 || selection[ 0 ] !== postIdToSelect ) {
				setSelection( [ postIdToSelect ] );
			}
			setPostIdToSelect( undefined );
		}
	}, [ postIdToSelect, selection, setSelection, isLoadingItems, items ] );
}
