import {
	insert,
	remove,
	privateApis as richTextPrivateApis,
} from '@wordpress/rich-text';
import { privateApis as composePrivateApis } from '@wordpress/compose';
import { unlock } from '../../../lock-unlock';

const { subscribeOwnedListener, ownsSelection } = unlock( richTextPrivateApis );
const { subscribeDelegatedListener } = unlock( composePrivateApis );

export default ( props ) => ( element ) => {
	// Enter is handled on beforeinput: the input type tells a paragraph
	// break from a line break. The iOS keyboard sends Return with the
	// shift key down while it shows capitals, so the key event cannot.
	function onBeforeInput( event ) {
		const { inputType } = event;
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
		unsubscribeDefaultBeforeInput();
		unsubscribeBeforeInput();
	};
};
