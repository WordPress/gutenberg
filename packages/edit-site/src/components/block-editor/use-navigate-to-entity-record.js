/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useCallback, useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useHistory, useLocation } = unlock( routerPrivateApis );

export default function useNavigateToEntityRecord() {
	const history = useHistory();
	const { getSelectedBlockClientId } = useSelect( ( select ) => {
		const { getSelectedBlockClientId: getSelected } =
			select( blockEditorStore );
		return {
			getSelectedBlockClientId: getSelected,
		};
	}, [] );

	const onNavigateToEntityRecord = useCallback(
		( params ) => {
			// Capture currently selected block before navigating
			const currentSelectedBlockClientId = getSelectedBlockClientId();

			// Store selected block for current location
			const currentPath =
				window.location.pathname + window.location.search;
			if ( currentSelectedBlockClientId ) {
				window.sessionStorage?.setItem(
					`gutenberg_selected_block_${ currentPath }`,
					currentSelectedBlockClientId
				);
			}

			history.navigate(
				`/${ params.postType }/${ params.postId }?canvas=edit&focusMode=true`
			);
		},
		[ history, getSelectedBlockClientId ]
	);

	return onNavigateToEntityRecord;
}

export function useRestoreBlockSelection() {
	const location = useLocation();
	const { selectBlock } = useDispatch( blockEditorStore );

	useEffect( () => {
		// Restore block selection when location changes
		const currentPath = window.location.pathname + window.location.search;
		const storedBlockClientId = window.sessionStorage?.getItem(
			`gutenberg_selected_block_${ currentPath }`
		);

		if ( storedBlockClientId && typeof window !== 'undefined' ) {
			const restoreSelection = () => {
				// Use a small delay to ensure content is rendered
				setTimeout( () => {
					selectBlock( storedBlockClientId );
				}, 100 );
			};

			if ( typeof window.requestAnimationFrame !== 'undefined' ) {
				window.requestAnimationFrame( restoreSelection );
			} else {
				restoreSelection();
			}
		}
	}, [ location, selectBlock ] );
}
