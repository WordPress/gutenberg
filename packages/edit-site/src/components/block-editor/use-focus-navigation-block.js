/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreDataStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useLocation } = unlock( routerPrivateApis );

/**
 * When navigating from the Navigation sidebar with focusNavigationBlock in the URL,
 * finds the navigation block with matching ref and selects it once the blocks have loaded.
 * Syncs the selection to the entity record via editEntityRecord so it integrates with
 * the existing selectedBlock flow (use-resolve-edited-entity, use-navigate-to-entity-record).
 */
export default function useFocusNavigationBlock() {
	const { query } = useLocation();
	const focusMenuId = query?.focusNavigationBlock;
	const appliedRef = useRef( null );

	const { navigationBlockClientId, postType, postId } = useSelect(
		( select ) => {
			const result = {
				navigationBlockClientId: null,
				postType: null,
				postId: null,
			};
			if ( ! focusMenuId ) {
				return result;
			}
			const { getBlocksByName, getBlockAttributes } =
				select( blockEditorStore );
			const navBlockIds = getBlocksByName( 'core/navigation' );
			const matchingId = navBlockIds.find( ( clientId ) => {
				const attrs = getBlockAttributes( clientId );
				return String( attrs?.ref ) === String( focusMenuId );
			} );
			result.navigationBlockClientId = matchingId || null;
			result.postType = select( editorStore ).getCurrentPostType();
			result.postId = select( editorStore ).getCurrentPostId();
			return result;
		},
		[ focusMenuId ]
	);

	const { selectBlock } = useDispatch( blockEditorStore );
	const { editEntityRecord } = useDispatch( coreDataStore );

	useEffect( () => {
		if (
			! focusMenuId ||
			! navigationBlockClientId ||
			appliedRef.current === focusMenuId
		) {
			return;
		}
		selectBlock( navigationBlockClientId );
		// Sync selection to entity record so it integrates with selectedBlock flow.
		if ( postType && postId ) {
			editEntityRecord(
				'postType',
				postType,
				postId,
				{
					selection: {
						selectionStart: { clientId: navigationBlockClientId },
						selectionEnd: { clientId: navigationBlockClientId },
					},
				},
				{ undoIgnore: true }
			);
		}
		appliedRef.current = focusMenuId;
	}, [
		focusMenuId,
		navigationBlockClientId,
		postType,
		postId,
		selectBlock,
		editEntityRecord,
	] );
}
