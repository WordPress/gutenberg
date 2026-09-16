import { ENTER } from '@wordpress/keycodes';
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
	function onKeyDown( event ) {
		if ( event.keyCode !== ENTER ) {
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

		if ( event.shiftKey ) {
			if ( ! disableLineBreaks ) {
				event.preventDefault();
				onChange( insert( value, '\n' ) );
			}
		} else if ( onSplitAtEnd && start === end && end === text.length ) {
			event.preventDefault();
			onSplitAtEnd();
		} else if (
			! supportsSplitting &&
			// The deprecated onSplit is flagged on the beforeinput event.
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

	function onBeforeInput( event ) {
		if ( event.inputType !== 'insertParagraph' ) {
			return;
		}
		const { onReplace, onSplit } = props.current;
		if ( onReplace && onSplit ) {
			event.__deprecatedOnSplit = true;
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
	// handlers, matching the timing of the previous raw element listener.
	const unsubscribeKeyDown = subscribeOwnedListener(
		element,
		'keydown',
		onKeyDown,
		true
	);
	const unsubscribeBeforeInput = subscribeOwnedListener(
		element,
		'beforeinput',
		onBeforeInput,
		true
	);
	return () => {
		unsubscribeDefaultBeforeInput();
		unsubscribeKeyDown();
		unsubscribeBeforeInput();
	};
};
