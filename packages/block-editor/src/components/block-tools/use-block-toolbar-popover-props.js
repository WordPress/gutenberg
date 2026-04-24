/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { getScrollContainer } from '@wordpress/dom';
import {
	useCallback,
	useLayoutEffect,
	useMemo,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { useBlockElement } from '../block-list/use-block-props/use-block-refs';
import { hasStickyOrFixedPositionValue } from '../../hooks/position';
import { getElementBounds } from '../../utils/dom';

const COMMON_PROPS = {
	placement: 'top-start',
};

// By default the toolbar sets the `shift` prop. If the user scrolls the page
// down the toolbar will stay on screen by adopting a sticky position at the
// top of the viewport.
const DEFAULT_PROPS = {
	...COMMON_PROPS,
	flip: false,
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
	shift: false,
};

/**
 * Get the popover props for the block toolbar, determined by the space at the top of the canvas and the toolbar height.
 *
 * @param {Element} contentElement       The DOM element that represents the editor content or canvas.
 * @param {Element} selectedBlockElement The outer DOM element of the first selected block.
 * @param {Element} scrollContainer      The scrollable container for the contentElement.
 * @param {number}  toolbarHeight        The height of the toolbar in pixels.
 * @param {boolean} isSticky             Whether or not the selected block is sticky or fixed.
 *
 * @return {Object} The popover props used to determine the position of the toolbar.
 */
function getProps(
	contentElement,
	selectedBlockElement,
	scrollContainer,
	toolbarHeight,
	isSticky
) {
	if ( ! contentElement || ! selectedBlockElement ) {
		return DEFAULT_PROPS;
	}

	// Get how far the content area has been scrolled.
	const scrollTop = scrollContainer?.scrollTop || 0;

	const blockRect = getElementBounds( selectedBlockElement );
	const contentRect = contentElement.getBoundingClientRect();

	// Get the vertical position of top of the visible content area.
	const topOfContentElementInViewport = scrollTop + contentRect.top;

	// The document element's clientHeight represents the viewport height.
	const viewportHeight =
		contentElement.ownerDocument.documentElement.clientHeight;

	// The restricted height area is calculated as the sum of the
	// vertical position of the visible content area, plus the height
	// of the block toolbar.
	const restrictedTopArea = topOfContentElementInViewport + toolbarHeight;
	const hasSpaceForToolbarAbove = blockRect.top > restrictedTopArea;

	const isBlockTallerThanViewport =
		blockRect.height > viewportHeight - toolbarHeight;

	// Sticky blocks are treated as if they will never have enough space for the toolbar above.
	if (
		! isSticky &&
		( hasSpaceForToolbarAbove || isBlockTallerThanViewport )
	) {
		return DEFAULT_PROPS;
	}

	return RESTRICTED_HEIGHT_PROPS;
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
	const { blockIndex, isSticky } = useSelect(
		( select ) => {
			const { getBlockIndex, getBlockAttributes } =
				select( blockEditorStore );
			return {
				blockIndex: getBlockIndex( clientId ),
				isSticky: hasStickyOrFixedPositionValue(
					getBlockAttributes( clientId )
				),
			};
		},
		[ clientId ]
	);
	const scrollContainer = useMemo( () => {
		if ( ! contentElement ) {
			return;
		}
		return getScrollContainer( contentElement );
	}, [ contentElement ] );
	const [ props, setProps ] = useState( () =>
		getProps(
			contentElement,
			selectedBlockElement,
			scrollContainer,
			toolbarHeight,
			isSticky
		)
	);

	const popoverRef = useRefEffect( ( popoverNode ) => {
		setToolbarHeight( popoverNode.offsetHeight );
	}, [] );

	const updateProps = useCallback(
		() =>
			setProps(
				getProps(
					contentElement,
					selectedBlockElement,
					scrollContainer,
					toolbarHeight,
					isSticky
				)
			),
		[ contentElement, selectedBlockElement, scrollContainer, toolbarHeight ]
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
