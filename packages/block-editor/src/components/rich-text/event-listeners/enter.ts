import { insert, remove } from '@wordpress/rich-text';
import type { RichTextField } from '../types';

// Enter is handled on beforeinput: the input type tells a paragraph break
// from a line break. The iOS keyboard sends Return with the shift key down
// while it shows capitals, so the key event cannot.
export function onBeforeInput( { props }: RichTextField, event: InputEvent ) {
	const { inputType } = event;
	if ( inputType !== 'insertParagraph' && inputType !== 'insertLineBreak' ) {
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
		// The writing flow reads the flag off the event.
		(
			event as InputEvent & { __deprecatedOnSplit?: boolean }
		 ).__deprecatedOnSplit = true;
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
				// The selection is collapsed at the end.
				_value.start = _value.end! - 2;
				onChange( remove( _value ) );
				onSplitAtDoubleLineEnd();
			} );
		} else {
			onChange( insert( value, '\n' ) );
		}
	}
}

// Prevents the browser from adding a paragraph or line break when no other
// handler did.
export function onDefaultBeforeInput(
	field: RichTextField,
	event: InputEvent
) {
	if (
		event.inputType === 'insertParagraph' ||
		event.inputType === 'insertLineBreak'
	) {
		event.preventDefault();
	}
}
