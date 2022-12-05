/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useCallback, useLayoutEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { __unstableUseBlockElement as useBlockElement } from '../block-list/use-block-props/use-block-refs';

const TOOLBAR_MARGIN = 12;

// By default the toolbar sets the `shift` prop and flip properties.
// If there is enough room, then once the block scrolls past the top of the screen,
// then the toolbar is flipped to the bottom.
const DEFAULT_PROPS = {
	placement: 'top-start',
	strategy: 'fixed',
	flip: true,
	shift: true,
};

/**
 * Get the popover props for the block toolbar, determined by the space at the top of the canvas and the toolbar height.
 *
 * @param {Element} contentElement       The DOM element that represents the editor content or canvas.
 * @param {Element} selectedBlockElement The outer DOM element of the first selected block.
 * @param {number}  toolbarHeight        The height of the toolbar in pixels.
 *
 * @return {Object} The popover props used to determine the position of the toolbar.
 */
function getProps( contentElement, selectedBlockElement, toolbarHeight ) {
	if ( ! contentElement || ! selectedBlockElement ) {
		return DEFAULT_PROPS;
	}

	const blockRect = selectedBlockElement.getBoundingClientRect();

	// The document element's clientHeight represents the viewport height.
	const viewportHeight =
		contentElement.ownerDocument.documentElement.clientHeight;

	const isBlockTallerThanViewport =
		blockRect.height > viewportHeight - toolbarHeight;

	if ( isBlockTallerThanViewport ) {
		return {
			...DEFAULT_PROPS,
			flip: false,
			shift: { padding: toolbarHeight - TOOLBAR_MARGIN },
		};
	}

	return {
		...DEFAULT_PROPS,
		flip: { padding: toolbarHeight },
		shift: { padding: toolbarHeight - TOOLBAR_MARGIN },
	};
}

/**
 * Determines the desired popover positioning behavior, returning a set of appropriate props.
 *
 * @param {Object}  elements
 * @param {Element} elements.contentElement The DOM element that represents the editor content or canvas.
 * @param {string}  elements.clientId       The clientId of the first selected block.
 *
 * @return {Object} The popover props used to determine the position of the toolbar.
 */
export default function useBlockToolbarPopoverProps( {
	contentElement,
	clientId,
} ) {
	const selectedBlockElement = useBlockElement( clientId );
	const [ toolbarHeight, setToolbarHeight ] = useState( 0 );
	const [ props, setProps ] = useState( () =>
		getProps( contentElement, selectedBlockElement, toolbarHeight )
	);
	const blockIndex = useSelect(
		( select ) => select( blockEditorStore ).getBlockIndex( clientId ),
		[ clientId ]
	);

	const popoverRef = useRefEffect( ( popoverNode ) => {
		setToolbarHeight( popoverNode.offsetHeight );
	}, [] );

	const updateProps = useCallback(
		() =>
			setProps(
				getProps( contentElement, selectedBlockElement, toolbarHeight )
			),
		[ contentElement, selectedBlockElement, toolbarHeight ]
	);

	// Update props when the block is moved. This also ensures the props are
	// correct on initial mount, and when the selected block or content element
	// changes (since the callback ref will update).
	useLayoutEffect( updateProps, [ blockIndex, updateProps ] );

	// Update props when the viewport is resized or the block is resized.
	useLayoutEffect( () => {
		if ( ! contentElement || ! selectedBlockElement ) {
			return;
		}

		// Update the toolbar props on viewport resize.
		const contentView = contentElement?.ownerDocument?.defaultView;
		contentView?.addEventHandler?.( 'resize', updateProps );

		// Update the toolbar props on block resize.
		let resizeObserver;
		const blockView = selectedBlockElement?.ownerDocument?.defaultView;
		if ( blockView.ResizeObserver ) {
			resizeObserver = new blockView.ResizeObserver( updateProps );
			resizeObserver.observe( selectedBlockElement );
		}

		return () => {
			contentView?.removeEventHandler?.( 'resize', updateProps );

			if ( resizeObserver ) {
				resizeObserver.disconnect();
			}
		};
	}, [ updateProps, contentElement, selectedBlockElement ] );

	return {
		...props,
		ref: popoverRef,
	};
}
