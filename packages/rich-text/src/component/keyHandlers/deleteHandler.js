import {createRecord} from "@wordpress/packages/rich-text/src/component/utils";
import {BACKSPACE} from "@wordpress/keycodes/src";
import {isCollapsed, remove} from "@wordpress/rich-text";
import {curry} from "ramda";
import {removeLineSeparator} from "@wordpress/packages/rich-text/build-module/remove-line-separator";

/**
 * Handles delete on keydown:
 * - outdent list items,
 * - delete content if everything is selected,
 * - trigger the onDelete prop when selection is uncollapsed and at an edge.
 *
 * @param root0
 * @param root0.recordData
 * @param root0.handleChange
 * @param root0.onDelete
 * @param root0.activeFormats
 * @param root0.multilineTag
 * @param event
 */
const _prepareDeleteEvent = (
	{ recordData, handleChange, onDelete, activeFormats, multilineTag },
	event
) => {
	const { keyCode } = event;
	const currentValue = createRecord( recordData );
	const { start, end, text } = currentValue;
	const isFullContentDeletion =
		start === 0 && end !== 0 && end === text.length;
	const isReverse = keyCode === BACKSPACE;

	const isTryingToDeleteOutsideOfContent =
		( isReverse && start !== 0 ) || ( ! isReverse && end !== text.length );

	const isEventNotApplicable =
		! onDelete ||
		! isCollapsed( currentValue ) ||
		activeFormats.length ||
		isTryingToDeleteOutsideOfContent;

	// Always handle full content deletion ourselves.
	if ( isFullContentDeletion ) {
		handleChange( remove( currentValue ) );
		return;
	}

	if ( multilineTag ) {
		const newValue = removeLineSeparator( currentValue, false );
		handleChange( newValue );
		return;
	}
	// Only process delete if the key press occurs at an uncollapsed edge.
	if ( isEventNotApplicable ) {
		return;
	}

	onDelete( { isReverse, value: currentValue } );
};

export const prepareDeleteEvent = curry( _prepareDeleteEvent );
