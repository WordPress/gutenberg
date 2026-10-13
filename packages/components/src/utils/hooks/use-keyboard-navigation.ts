import { useCallback, useState } from '@wordpress/element';

/**
 * Tracks keyboard navigation separately from pointer hover in option lists.
 *
 * @param initiallyKeyboard Whether the list opens from keyboard input.
 */
export function useKeyboardNavigation( initiallyKeyboard = false ) {
	const [ isKeyboardNavigation, setIsKeyboardNavigation ] =
		useState( initiallyKeyboard );
	const onKeyDown = useCallback( ( event: Pick< KeyboardEvent, 'key' > ) => {
		if ( ! [ 'Shift', 'Control', 'Alt', 'Meta' ].includes( event.key ) ) {
			setIsKeyboardNavigation( true );
		}
	}, [] );
	const onPointer = useCallback( () => setIsKeyboardNavigation( false ), [] );

	return { isKeyboardNavigation, onKeyDown, onPointer };
}
