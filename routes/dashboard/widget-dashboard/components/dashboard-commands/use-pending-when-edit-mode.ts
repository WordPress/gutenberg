/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef } from '@wordpress/element';

type usePendingWhenEditModeProps = {
	editMode: boolean;
	onEditChange?: ( next: boolean ) => void;
};

type usePendingWhenEditModeResult = ( action: () => void ) => void;

/**
 * Runs an action immediately when already in edit mode. Otherwise enables
 * edit mode and runs the action after edit mode becomes active.
 *
 * @param {usePendingWhenEditModeProps} params - The parameters for the function.
 * @return {usePendingWhenEditModeResult} The function result.
 */
export function usePendingWhenEditMode( {
	editMode,
	onEditChange,
}: usePendingWhenEditModeProps ): usePendingWhenEditModeResult {
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
