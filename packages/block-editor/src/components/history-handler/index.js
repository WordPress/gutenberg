/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { useRef, useEffect } from '@wordpress/element';

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
