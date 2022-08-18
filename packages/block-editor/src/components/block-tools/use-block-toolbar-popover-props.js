/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

const TOOLBAR_HEIGHT = 72;
const DEFAULT_PROPS = { __unstableForcePosition: true, __unstableShift: true };
const RESTRICTED_HEIGHT_PROPS = {
	__unstableForcePosition: false,
	__unstableShift: false,
};

function getProps( contentElement, selectedBlockElement ) {
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

/**
 * Determines the desired popover positioning behavior, returning a set of appropriate props.
 *
 * @param {Object}  elements
 * @param {Element} elements.contentElement       The DOM element that represents the editor content or canvas.
 * @param {Element} elements.selectedBlockElement The DOM element that represents the first selected block.
 *
 * @return {Object} The popover props used to determine the position of the toolbar.
 */
export default function useBlockToolbarPopoverProps( {
	contentElement,
	selectedBlockElement,
} ) {
	const [ props, setProps ] = useState(
		getProps( contentElement, selectedBlockElement )
	);

	useEffect( () => {
		if ( ! contentElement || ! selectedBlockElement ) {
			return;
		}

		const updateProps = () =>
			setProps( getProps( contentElement, selectedBlockElement ) );

		// Update whenever the content or selectedBlock elements change.
		updateProps();

		// Update on window resize - wrapping can change the amount of space
		// above a block, and result in the toolbar position needing to change.
		const view = contentElement?.ownerDocument?.defaultView;
		view?.addEventHandler?.( 'resize', updateProps );

		return () => {
			view?.removeEventHandler?.( 'resize', updateProps );
		};
	}, [ contentElement, selectedBlockElement ] );

	return props;
}
