/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { useRef, useEffect } from '@wordpress/element';

/**
 * Prevents default behaviour and handles the `historyUndo` and `historyRedo`
 * input event types during the `beforeinput` event bubbling from within the
 * rendered tree. Instead of updating the browser's undo stack (and creating an
 * extra editor undo level), the editor's undo stack should updated (and the
 * `beforeinput` should be cancelled).
 *
 * @param {Object} props Component props.
 */
export default function HistoryHandler( { children } ) {
	const ref = useRef();
	const { undo, redo } = useDispatch( 'core/editor' );

	useEffect( () => {
		const onBeforeInput = ( event ) => {
			if ( event.inputType === 'historyUndo' ) {
				event.preventDefault();
				undo();
			} else if ( event.inputType === 'historyRedo' ) {
				event.preventDefault();
				redo();
			}
		};

		ref.current.addEventListener( 'beforeinput', onBeforeInput );

		return () => {
			ref.current.removeEventListener( 'beforeinput', onBeforeInput );
		};
	} );

	return (
		<div ref={ ref }>
			{ children }
		</div>
	);
}
