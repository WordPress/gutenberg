import {LEFT, RIGHT} from "@wordpress/keycodes/src";

export const getCanCaretMoveInChosenDirection = ( currentRecord, getDirection, event ) => {
	const {
		text,
		start,
		end,
		activeFormats: currentActiveFormats = [],
	} = currentRecord;
	// To do: ideally, we should look at visual position instead.

	const reverseKey = getDirection() === 'rtl' ? RIGHT : LEFT;
	const isReverse = event.keyCode === reverseKey;
	const isCurrentActiveFormatsEmpty = currentActiveFormats.length === 0;

	// If the selection is collapsed and at the very start, do nothing if
	// navigating backward.
	// If the selection is collapsed and at the very end, do nothing if
	// navigating forward.
	const isGoingOutOfTheReach =
		( start === 0 && isReverse ) || ( end === text.length && ! isReverse );

	// If the selection is not collapsed, let the browser handle collapsing
	// the selection for now. Later we could expand this logic to set
	// boundary positions if needed.
	return isCurrentActiveFormatsEmpty && isGoingOutOfTheReach;
};

