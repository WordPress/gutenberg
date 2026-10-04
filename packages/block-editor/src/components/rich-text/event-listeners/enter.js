import {
	insert,
	remove,
	privateApis as richTextPrivateApis,
} from '@wordpress/rich-text';
import { privateApis as composePrivateApis } from '@wordpress/compose';
import { ENTER } from '@wordpress/keycodes';
import { unlock } from '../../../lock-unlock';

const { subscribeOwnedListener, ownsSelection } = unlock( richTextPrivateApis );
const { subscribeDelegatedListener } = unlock( composePrivateApis );

export default ( props ) => ( element ) => {
	// In desktop Safari Shift+Enter arrives as insertParagraph, the only
	// input type that splits a block (#84047), and an input event has no
	// shift key, so the keydown has to say it was Shift+Enter. The iOS
	// keyboard sets the shift key on Return while it shows capitals and is
	// not known to send a Shift key event then, so the shift key counts
	// only after one was seen. There is no keyup listener: when the main
	// thread is busy, Safari can send the keyup of a modifier before the
	// keydown of the key it modifies,
	// https://bugs.webkit.org/show_bug.cgi?id=307198.
	let shiftPressed = false;
	let shiftEnter = false;
	let shiftEnterEvent;

	function onKeyDown( event ) {
		// True after a Shift key event, and for as long as the keys that
		// follow keep the shift key. A Caps Lock key is not a Shift press.
		shiftPressed =
			event.key === 'Shift' ||
			( shiftPressed && event.shiftKey && event.key !== 'CapsLock' );
		// Every keydown replaces this, so it lasts until the next key.
		shiftEnter = event.keyCode === ENTER && shiftPressed;
	}

	// Cancels the paragraph break of Shift+Enter before the listeners that
	// would split the block can act on it. It is attached to the window in
	// the capture phase so it runs before the owned listeners, whatever
	// order they were attached in. It leaves the line break to
	// onBeforeInput, which runs after the capture phase listener that
	// syncs the selection with the value.
	function onShiftEnterBeforeInput( event ) {
		const { inputType } = event;
		// Other input types can arrive between the keydown and the break.
		if (
			inputType !== 'insertParagraph' &&
			inputType !== 'insertLineBreak'
		) {
			return;
		}
		const isShiftEnter = shiftEnter;
		shiftEnter = false;
		if (
			isShiftEnter &&
			inputType === 'insertParagraph' &&
			! event.defaultPrevented &&
			ownsSelection( element )
		) {
			shiftEnterEvent = event;
			event.preventDefault();
		}
	}

	// Enter is handled on beforeinput: the input type tells a paragraph
	// break from a line break. The iOS keyboard sends Return with the
	// shift key down while it shows capitals, so the key event cannot.
	function onBeforeInput( event ) {
		const inputType =
			event === shiftEnterEvent ? 'insertLineBreak' : event.inputType;
		if (
			inputType !== 'insertParagraph' &&
			inputType !== 'insertLineBreak'
		) {
			return;
		}

		const {
			onReplace,
			onSplit,
			supportsSplitting,
			disableLineBreaks,
			onChange,
			getValue,
			onSplitAtDoubleLineEnd,
			registry,
			onSplitAtEnd,
		} = props.current;
		// The rendered value can lag the record: the capture phase listener
		// that syncs the selection runs on this event, and a re-render with
		// the new selection has not happened yet.
		const value = getValue();
		const { text, start, end } = value;

		// Flagged for the writing flow, which handles the event otherwise.
		if ( inputType === 'insertParagraph' && onReplace && onSplit ) {
			event.__deprecatedOnSplit = true;
		}

		if ( inputType === 'insertLineBreak' ) {
			if ( ! disableLineBreaks ) {
				event.preventDefault();
				onChange( insert( value, '\n' ) );
			}
		} else if ( onSplitAtEnd && start === end && end === text.length ) {
			event.preventDefault();
			onSplitAtEnd();
		} else if (
			! supportsSplitting &&
			! ( onReplace && onSplit ) &&
			! disableLineBreaks &&
			! event.defaultPrevented
		) {
			event.preventDefault();
			if (
				// For some blocks it's desirable to split at the end of the
				// block when there are two line breaks at the end of the
				// block, so triple Enter exits the block.
				onSplitAtDoubleLineEnd &&
				start === end &&
				end === text.length &&
				text.slice( -2 ) === '\n\n'
			) {
				registry.batch( () => {
					const _value = { ...value };
					_value.start = _value.end - 2;
					onChange( remove( _value ) );
					onSplitAtDoubleLineEnd();
				} );
			} else {
				onChange( insert( value, '\n' ) );
			}
		}
	}

	function onDefaultBeforeInput( event ) {
		if (
			event.defaultPrevented ||
			( event.inputType !== 'insertParagraph' &&
				event.inputType !== 'insertLineBreak' )
		) {
			return;
		}

		// The event listener is attached to the window, so we need to check if
		// the target is the element, or whether the element owns the
		// selection through a focused editing host.
		if ( event.target !== element && ! ownsSelection( element ) ) {
			return;
		}

		event.preventDefault();
	}

	const { defaultView } = element.ownerDocument;

	const unsubscribeKeyDown = subscribeDelegatedListener(
		defaultView,
		'keydown',
		onKeyDown,
		true
	);
	const unsubscribeShiftEnterBeforeInput = subscribeDelegatedListener(
		defaultView,
		'beforeinput',
		onShiftEnterBeforeInput,
		true
	);
	// Attach the listener to the window so parent elements have the chance to
	// prevent the default behavior.
	const unsubscribeDefaultBeforeInput = subscribeDelegatedListener(
		defaultView,
		'beforeinput',
		onDefaultBeforeInput
	);
	// Capture phase so this runs before ancestor (writing flow) bubble
	// handlers.
	const unsubscribeBeforeInput = subscribeOwnedListener(
		element,
		'beforeinput',
		onBeforeInput,
		true
	);
	return () => {
		unsubscribeKeyDown();
		unsubscribeShiftEnterBeforeInput();
		unsubscribeDefaultBeforeInput();
		unsubscribeBeforeInput();
	};
};
