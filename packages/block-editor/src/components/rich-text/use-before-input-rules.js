/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';
import { insert, isCollapsed } from '@wordpress/rich-text';
import { useDispatch } from '@wordpress/data';
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

/**
 * When typing over a selection, the selection will we wrapped by a matching
 * character pair. The second character is optional, it defaults to the first
 * character.
 *
 * @type {string[]} Array of character pairs.
 */
const wrapSelectionSettings = [ '`', '"', "'", '“”', '‘’' ];

export function useBeforeInputRules( props ) {
	const {
		__unstableMarkLastChangeAsPersistent,
		__unstableMarkAutomaticChange,
	} = useDispatch( blockEditorStore );
	const propsRef = useRef( props );
	propsRef.current = props;
	return useRefEffect( ( element ) => {
		function onInput( event ) {
			const { inputType, data } = event;
			const { value, onChange } = propsRef.current;

			// Only run the rules when inserting text.
			if ( inputType !== 'insertText' ) {
				return;
			}

			if ( isCollapsed( value ) ) {
				return;
			}

			const pair = applyFilters(
				'blockEditor.wrapSelectionSettings',
				wrapSelectionSettings
			).find(
				( [ startChar, endChar ] ) =>
					startChar === data || endChar === data
			);

			if ( ! pair ) {
				return;
			}

			const [ startChar, endChar = startChar ] = pair;
			const start = value.start;
			const end = value.end + startChar.length;

			let newValue = insert( value, startChar, start, start );
			newValue = insert( newValue, endChar, end, end );

			__unstableMarkLastChangeAsPersistent();
			onChange( newValue );
			__unstableMarkAutomaticChange();

			const init = {};

			for ( const key in event ) {
				init[ key ] = event[ key ];
			}

			init.data = endChar;

			const { ownerDocument } = element;
			const { defaultView } = ownerDocument;
			const newEvent = new defaultView.InputEvent( 'input', init );

			// Dispatch an `input` event with the new data. This will trigger the
			// input rules.
			// Postpone the `input` to the next event loop tick so that the dispatch
			// doesn't happen synchronously in the middle of `beforeinput` dispatch.
			// This is closer to how native `input` event would be timed, and also
			// makes sure that the `input` event is dispatched only after the `onChange`
			// call few lines above has fully updated the data store state and rerendered
			// all affected components.
			window.queueMicrotask( () => {
				event.target.dispatchEvent( newEvent );
			} );
			event.preventDefault();
		}

		element.addEventListener( 'beforeinput', onInput );
		return () => {
			element.removeEventListener( 'beforeinput', onInput );
		};
	}, [] );
}
