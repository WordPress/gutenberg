/**
 * WordPress dependencies
 */
import { isEmpty, split, toHTMLString } from '@wordpress/rich-text';

/*
 * Signals to the RichText owner that the block can be replaced with two blocks
 * as a result of splitting the block by pressing enter, or with blocks as a
 * result of splitting the block by pasting block content in the instance.
 */
export function splitValue( {
	value,
	pastedBlocks = [],
	onReplace,
	onSplit,
	onSplitMiddle,
	multilineTag,
} ) {
	if ( ! onReplace || ! onSplit ) {
		return;
	}

	const blocks = [];
	const [ before, after ] = split( value );
	const hasPastedBlocks = pastedBlocks.length > 0;
	let lastPastedBlockIndex = -1;

	// Consider the after value to be the original it is not empty and the
	// before value *is* empty.
	const isAfterOriginal = isEmpty( before ) && ! isEmpty( after );

	// Create a block with the content before the caret if there's no pasted
	// blocks, or if there are pasted blocks and the value is not empty. We do
	// not want a leading empty block on paste, but we do if split with e.g. the
	// enter key.
	if ( ! hasPastedBlocks || ! isEmpty( before ) ) {
		blocks.push(
			onSplit(
				toHTMLString( {
					value: before,
					multilineTag,
				} ),
				! isAfterOriginal
			)
		);
		lastPastedBlockIndex += 1;
	}

	if ( hasPastedBlocks ) {
		blocks.push( ...pastedBlocks );
		lastPastedBlockIndex += pastedBlocks.length;
	} else if ( onSplitMiddle ) {
		blocks.push( onSplitMiddle() );
	}

	// If there's pasted blocks, append a block with non empty content / after
	// the caret. Otherwise, do append an empty block if there is no
	// `onSplitMiddle` prop, but if there is and the content is empty, the
	// middle block is enough to set focus in.
	if (
		hasPastedBlocks
			? ! isEmpty( after )
			: ! onSplitMiddle || ! isEmpty( after )
	) {
		blocks.push(
			onSplit(
				toHTMLString( {
					value: after,
					multilineTag,
				} ),
				isAfterOriginal
			)
		);
	}

	// If there are pasted blocks, set the selection to the last one. Otherwise,
	// set the selection to the second block.
	const indexToSelect = hasPastedBlocks ? lastPastedBlockIndex : 1;

	// If there are pasted blocks, move the caret to the end of the selected
	// block Otherwise, retain the default value.
	const initialPosition = hasPastedBlocks ? -1 : 0;

	onReplace( blocks, indexToSelect, initialPosition );
}
