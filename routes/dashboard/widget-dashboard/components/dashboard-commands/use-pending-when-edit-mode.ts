/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef } from '@wordpress/element';

/**
 * Runs an action immediately when already in edit mode. Otherwise enables
 * edit mode and runs the action after edit mode becomes active.
 * @param root0
 * @param root0.editMode
 * @param root0.onEditChange
 */
export function usePendingWhenEditMode( {
	editMode,
	onEditChange,
}: {
	editMode: boolean;
	onEditChange?: ( next: boolean ) => void;
} ) {
	const pendingRef = useRef< ( () => void ) | null >( null );
	const wasEditingRef = useRef( editMode );

	useEffect( () => {
		if ( ! wasEditingRef.current && editMode && pendingRef.current ) {
			const action = pendingRef.current;
			pendingRef.current = null;
			action();
		}
		wasEditingRef.current = editMode;
	}, [ editMode ] );

	return useCallback(
		( action: () => void ) => {
			if ( editMode ) {
				action();
				return;
			}

			pendingRef.current = action;
			onEditChange?.( true );
		},
		[ editMode, onEditChange ]
	);
}
