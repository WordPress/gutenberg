/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Popover } from '@wordpress/components';
import { getScrollContainer } from '@wordpress/dom';
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { __unstableUseBlockElement as useBlockElement } from '../block-list/use-block-props/use-block-refs';

/**
 * Allow scrolling "through" popovers over the canvas. This is only called for
 * as long as the pointer is over a popover. Do not use React events because it
 * will bubble through portals.
 *
 * @param {Object} scrollableRef
 */
export function usePopoverScroll( scrollableRef ) {
	return useRefEffect(
		( node ) => {
			if ( ! scrollableRef ) {
				return;
			}

			function onWheel( event ) {
				const { deltaX, deltaY } = event;
				scrollableRef.current.scrollBy( deltaX, deltaY );
			}
			// Tell the browser that we do not call event.preventDefault
			// See https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#improving_scrolling_performance_with_passive_listeners
			const options = { passive: true };
			node.addEventListener( 'wheel', onWheel, options );
			return () => {
				node.removeEventListener( 'wheel', onWheel, options );
			};
		},
		[ scrollableRef ]
	);
}

export default function BlockPopover( {
	clientId,
	bottomClientId,
	children,
	__unstablePopoverSlot,
	__unstableContentRef,
	...props
} ) {
	const selectedElement = useBlockElement( clientId );
	const lastSelectedElement = useBlockElement( bottomClientId ?? clientId );
	const popoverScrollRef = usePopoverScroll( __unstableContentRef );

	if ( ! selectedElement || ( bottomClientId && ! lastSelectedElement ) ) {
		return null;
	}

	const anchorRef = {
		top: selectedElement,
		bottom: lastSelectedElement,
	};

	const { ownerDocument } = selectedElement;
	const stickyBoundaryElement =
		ownerDocument.defaultView.frameElement ||
		getScrollContainer( selectedElement ) ||
		ownerDocument.body;

	return (
		<Popover
			ref={ popoverScrollRef }
			noArrow
			animate={ false }
			position="top right left"
			focusOnMount={ false }
			anchorRef={ anchorRef }
			__unstableStickyBoundaryElement={ stickyBoundaryElement }
			// Render in the old slot if needed for backward compatibility,
			// otherwise render in place (not in the the default popover slot).
			__unstableSlotName={ __unstablePopoverSlot || null }
			__unstableBoundaryParent
			// Observe movement for block animations (especially horizontal).
			__unstableObserveElement={ selectedElement }
			shouldAnchorIncludePadding
			// Used to safeguard sticky position behavior against cases where it would permanently
			// obscure specific sections of a block.
			__unstableEditorCanvasWrapper={ __unstableContentRef?.current }
			{ ...props }
			className={ classnames(
				'block-editor-block-popover',
				props.className
			) }
		>
			{ children }
		</Popover>
	);
}
