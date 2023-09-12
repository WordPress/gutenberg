/**
 * WordPress dependencies
 */
import { createUndoManager } from '@wordpress/undo-manager';
import { useCallback, useRef, useState, useEffect } from '@wordpress/element';

/**
 * useState with undo/redo history.
 *
 * @param initialValue Initial value.
 * @return Value, setValue, hasUndo, hasRedo, undo, redo.
 */
export default function useStateWithHistory< T >( initialValue: T ) {
	const manager = useRef( createUndoManager() );
	const [ value, setValue ] = useState( initialValue );
	const currentValue = useRef( value );
	useEffect( () => {
		currentValue.current = value;
	}, [ value ] );

	return {
		value,
		setValue: useCallback( ( newValue: T, isStaged: boolean ) => {
			manager.current.addRecord(
				[
					{
						id: 'object',
						changes: {
							prop: { from: currentValue.current, to: newValue },
						},
					},
				],
				isStaged
			);
			setValue( newValue );
		}, [] ),
		hasUndo: !! manager.current.getUndoRecord(),
		hasRedo: !! manager.current.getRedoRecord(),
		undo: useCallback( () => {
			const undoRecord = manager.current.getUndoRecord();
			if ( undoRecord ) {
				manager.current.undo();
				setValue( undoRecord[ 0 ].changes.prop.from );
			}
		}, [] ),
		redo: useCallback( () => {
			const redoRecord = manager.current.getRedoRecord();
			if ( redoRecord ) {
				manager.current.redo();
				setValue( redoRecord[ 0 ].changes.prop.to );
			}
		}, [] ),
	};
}
