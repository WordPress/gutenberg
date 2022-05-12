/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';
import { BACKSPACE } from '@wordpress/keycodes';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import useOutdentListItem from './use-outdent-list-item';

export default function useBackspace( props ) {
	const { getSelectionStart, getSelectionEnd } = useSelect(
		blockEditorStore
	);
	const propsRef = useRef( props );
	propsRef.current = props;
	const [ canOutdent, outdentListItem ] = useOutdentListItem(
		propsRef.current.clientId
	);
	return useRefEffect(
		( element ) => {
			function onKeyDown( event ) {
				if ( event.defaultPrevented || event.keyCode !== BACKSPACE ) {
					return;
				}
				// Handle only if we have a collapsed selection at the
				// start of a list item and we can outdent.
				if (
					! canOutdent ||
					[
						getSelectionStart().offset,
						getSelectionEnd().offset,
					].some( ( offset ) => offset !== 0 )
				) {
					return;
				}
				event.preventDefault();
				outdentListItem();
			}

			element.addEventListener( 'keydown', onKeyDown );
			return () => {
				element.removeEventListener( 'keydown', onKeyDown );
			};
		},
		[ canOutdent ]
	);
}
