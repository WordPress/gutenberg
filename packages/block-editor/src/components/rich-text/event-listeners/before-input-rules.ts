import {
	insert,
	isCollapsed,
	privateApis as richTextPrivateApis,
} from '@wordpress/rich-text';
import { applyFilters } from '@wordpress/hooks';
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';
import type { RichTextEventListener } from '../types';

const { subscribeOwnedListener } = unlock( richTextPrivateApis );

/**
 * When typing over a selection, the selection will we wrapped by a matching
 * character pair. The second character is optional, it defaults to the first
 * character.
 */
const wrapSelectionSettings: string[] = [ '`', '"', "'", '“”', '‘’' ];

const beforeInputRules: RichTextEventListener = ( props ) => ( element ) => {
	function onInput( event: InputEvent ) {
		const { inputType, data } = event;
		const { value, onChange, registry } = props.current;

		// Only run the rules when inserting text.
		if ( inputType !== 'insertText' ) {
			return;
		}

		if ( isCollapsed( value ) ) {
			return;
		}

		// Filters are untyped.
		const pair = (
			applyFilters(
				'blockEditor.wrapSelectionSettings',
				wrapSelectionSettings
			) as string[]
		 ).find(
			( [ startChar, endChar ] ) => startChar === data || endChar === data
		);

		if ( ! pair ) {
			return;
		}

		const [ startChar, endChar = startChar ] = pair;
		// A selection is not collapsed without both ends.
		const start = value.start!;
		const end = value.end! + startChar.length;

		let newValue = insert( value, startChar, start, start );
		newValue = insert( newValue, endChar, end, end );

		const {
			__unstableMarkLastChangeAsPersistent,
			__unstableMarkAutomaticChange,
		} = registry.dispatch( blockEditorStore );

		__unstableMarkLastChangeAsPersistent();
		onChange( newValue );
		__unstableMarkAutomaticChange();

		const init: InputEventInit = {};

		for ( const key in event ) {
			// Copies the event's own properties, which the init dictionary shares.
			( init as Record< string, unknown > )[ key ] =
				event[ key as keyof InputEvent ];
		}

		init.data = endChar;

		const { ownerDocument } = element;
		// The element is in a document with a window.
		const defaultView = ownerDocument.defaultView!;
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
			element.dispatchEvent( newEvent );
		} );
		event.preventDefault();
	}

	return subscribeOwnedListener( element, 'beforeinput', onInput, true );
};

export default beforeInputRules;
