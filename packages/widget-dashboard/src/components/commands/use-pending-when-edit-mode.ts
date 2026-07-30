/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef } from '@wordpress/element';

type UsePendingWhenEditModeProps = {
	editMode: boolean;
	onEditChange?: ( next: boolean ) => void;
};

type UsePendingWhenEditModeResult = ( action: () => void ) => void;

/**
 * Runs an action immediately when already in edit mode. Otherwise enables
 * edit mode and runs the action after edit mode becomes active.
 *
 * @param {UsePendingWhenEditModeProps} params Current edit mode and the change handler.
 * @return {UsePendingWhenEditModeResult} Runs an action, deferring it until edit mode is active.
 */
export function usePendingWhenEditMode( {
	editMode,
	onEditChange,
}: UsePendingWhenEditModeProps ): UsePendingWhenEditModeResult {
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
