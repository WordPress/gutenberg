/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';

/**
 * Allows navigation mode to be exited by clicking in the selected block.
 *
 * @param {string} clientId Block client ID.
 */
export function useNavModeExit( clientId ) {
	const isEnabled = useSelect( ( select ) => {
		const { isNavigationMode, isBlockSelected } = select(
			blockEditorStore
		);
		return isNavigationMode() && isBlockSelected( clientId );
	}, [] );
	const { setNavigationMode } = useDispatch( blockEditorStore );

	return useRefEffect(
		( node ) => {
			if ( ! isEnabled ) {
				return;
			}

			function onMouseDown() {
				setNavigationMode( false );
			}

			node.addEventListener( 'mousedown', onMouseDown );

			return () => {
				node.addEventListener( 'mousedown', onMouseDown );
			};
		},
		[ isEnabled ]
	);
}
