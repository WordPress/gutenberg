const DEFAULT_PLACEMENT = 'top-start';
const FLIPPED_PLACEMENT = 'bottom-start';
const TOOLBAR_HEIGHT = 72;

export default function useFlipBlockToolbar( {
	contentElement,
	selectedBlockElement,
} ) {
	if ( ! contentElement || ! selectedBlockElement ) {
		return DEFAULT_PLACEMENT;
	}

	const blockRect = selectedBlockElement.getBoundingClientRect();
	const contentRect = contentElement.getBoundingClientRect();

	if ( blockRect.top - contentRect.top > TOOLBAR_HEIGHT ) {
		return DEFAULT_PLACEMENT;
	}

	return FLIPPED_PLACEMENT;
}
