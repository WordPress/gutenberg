const TOOLBAR_HEIGHT = 72;
const DEFAULT_PROPS = { __unstableForcePosition: true, __unstableShift: true };
const RESTRICTED_HEIGHT_PROPS = {
	__unstableForcePosition: false,
	__unstableShift: false,
};

export default function useBlockToolbarPopoverProps( {
	contentElement,
	selectedBlockElement,
} ) {
	if ( ! contentElement || ! selectedBlockElement ) {
		return DEFAULT_PROPS;
	}

	const blockRect = selectedBlockElement.getBoundingClientRect();
	const contentRect = contentElement.getBoundingClientRect();

	if ( blockRect.top - contentRect.top > TOOLBAR_HEIGHT ) {
		return DEFAULT_PROPS;
	}

	// When there's not enough space at the top of the canvas for the toolbar,
	// enable flipping and disable shifting.
	return RESTRICTED_HEIGHT_PROPS;
}
