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

const COMMON_PROPS = {
	placement: 'top-start',
	strategy: 'fixed',
};

// By default the toolbar sets the `shift` prop. If the user scrolls the page
// down the toolbar will stay on screen by adopting a sticky position at the
// top of the viewport.
const DEFAULT_PROPS = {
	...COMMON_PROPS,
	flip: true,
	shift: true,
};

// When there isn't enough height between the top of the block and the editor
// canvas, the `shift` prop is set to `false`, as it will cause the block to be
// obscured. The `flip` behavior is enabled, which positions the toolbar below
// the block. This only happens if the block is smaller than the viewport, as
// otherwise the toolbar will be off-screen.
const RESTRICTED_HEIGHT_PROPS = {
	...COMMON_PROPS,
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
	const contentRect = contentElement.getBoundingClientRect();

	// The document element's clientHeight represents the viewport height.
	const viewportHeight =
		contentElement.ownerDocument.documentElement.clientHeight;

	// The calculation for the following adds the two `top` values together.
	// If an element is positioned higher than the viewport, then its `top` value will be
	// negative, so using an addition ensures that the values are calculated appropriately.
	const hasSpaceForToolbarAbove =
		blockRect.top + contentRect.top > toolbarHeight;
	const isBlockTallerThanViewport =
		blockRect.height > viewportHeight - toolbarHeight;

	if ( isBlockTallerThanViewport ) {
		return {
			...DEFAULT_PROPS,
			flip: false,
			shift: { padding: toolbarHeight - TOOLBAR_MARGIN },
		};
	}

	if ( hasSpaceForToolbarAbove ) {
		return {
			...DEFAULT_PROPS,
			flip: { padding: toolbarHeight },
			shift: { padding: toolbarHeight - TOOLBAR_MARGIN },
		};
	}

	return {
		...RESTRICTED_HEIGHT_PROPS,
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

		// TODO: There must be a better way to find the scroll container for the editor than this.
		// Unfortunately, `contentView` isn't the right element to watch for scroll events.
		const scrollContainer = selectedBlockElement?.closest?.(
			'.interface-interface-skeleton__content'
		);
		scrollContainer.addEventListener( 'scroll', updateProps );

		// Update the toolbar props on block resize.
		let resizeObserver;
		const blockView = selectedBlockElement?.ownerDocument?.defaultView;
		if ( blockView.ResizeObserver ) {
			resizeObserver = new blockView.ResizeObserver( updateProps );
			resizeObserver.observe( selectedBlockElement );
		}

		return () => {
			contentView?.removeEventHandler?.( 'resize', updateProps );
			scrollContainer?.removeEventListener?.( 'scroll', updateProps );

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
