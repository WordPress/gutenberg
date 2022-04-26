/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Popover } from '@wordpress/components';
import { getScrollContainer } from '@wordpress/dom';
import { useMemo, useLayoutEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { __unstableUseBlockElement as useBlockElement } from '../block-list/use-block-props/use-block-refs';
import usePopoverScroll from './use-popover-scroll';

export default function BlockPopover( {
	clientId,
	bottomClientId,
	rootClientId,
	children,
	__unstableRefreshSize,
	__unstableCoverTarget = false,
	__unstablePopoverSlot,
	__unstableContentRef,
	...props
} ) {
	const [ layoutBound, setLayoutBound ] = useState( null );
	const selectedElement = useBlockElement( clientId );
	const rootElement = useBlockElement( rootClientId );

	useLayoutEffect( () => {
		if ( ! rootElement ) {
			return;
		}

		const parentBoundary = rootElement?.getBoundingClientRect()?.bottom;

		const elChildren = selectedElement?.children;

		function isVisible( el ) {
			const hasHeight = el.offsetHeight > 0;

			const compStyle = window.getComputedStyle( el );

			return (
				hasHeight ||
				compStyle.visibility !== 'hidden' ||
				compStyle.opacity !== 0 ||
				! el.classList.contains( 'components-visually-hidden' )
			);
		}

		function getOutsideBounds( nodes, currCandidate ) {
			if ( ! nodes?.length ) {
				return null;
			}

			return Array.from( nodes )?.reduce(
				( acc, curr ) => {
					if ( ! isVisible( curr ) ) {
						return acc;
					}

					const bottom = curr.getBoundingClientRect().bottom;

					// Update
					if (
						bottom > parentBoundary && // is beyond parent bottom edge
						bottom > acc[ 0 ] && // is beyond bototm edge of any of its siblings
						bottom > currCandidate[ 0 ] // is beyond the bottom edge of the current largest candidate element
					) {
						acc = [ bottom, curr ];
					}

					// Recurse through child elements.
					if ( curr?.children?.length ) {
						const childResults = getOutsideBounds(
							curr.children,
							acc
						);

						if ( childResults ) {
							acc.concat( childResults );
						}
					}

					return acc;
				},
				[ 0 ]
			);
		}

		function checkLayoutBounds() {
			if ( ! elChildren?.length ) {
				return;
			}

			const candidate = getOutsideBounds( elChildren, [ 0 ] );

			if ( candidate ) {
				setLayoutBound( candidate[ 1 ] );
			}
		}

		checkLayoutBounds();

		// Watch for DOM changes and check bounds to determine toolbar anchoring.
		const observer = new window.MutationObserver( checkLayoutBounds );

		observer.observe( selectedElement, {
			attributes: true,
			childList: true,
			subtree: true,
		} );

		return () => {
			observer.disconnect();
		};

		// console.log( {
		// 	selectedElement,
		// 	rootElement,
		// 	elChildren,
		// 	boundary,
		// 	candidate,
		// } );
	}, [ rootElement, selectedElement ] );

	const lastSelectedElement = useBlockElement( bottomClientId ?? clientId );
	const popoverScrollRef = usePopoverScroll( __unstableContentRef );
	const style = useMemo( () => {
		if ( ! selectedElement || lastSelectedElement !== selectedElement ) {
			return {};
		}

		return {
			position: 'absolute',
			width: selectedElement.offsetWidth,
			height: selectedElement.offsetHeight,
		};
	}, [ selectedElement, lastSelectedElement, __unstableRefreshSize ] );

	if ( ! selectedElement || ( bottomClientId && ! lastSelectedElement ) ) {
		return null;
	}

	const anchorRef = {
		top: selectedElement,
		bottom: layoutBound ?? lastSelectedElement,
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
			__unstableStickyBoundaryElement={
				__unstableCoverTarget ? undefined : stickyBoundaryElement
			}
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
			__unstableForcePosition={ __unstableCoverTarget }
			{ ...props }
			className={ classnames(
				'block-editor-block-popover',
				props.className
			) }
		>
			{ __unstableCoverTarget && <div style={ style }>{ children }</div> }
			{ ! __unstableCoverTarget && children }
		</Popover>
	);
}
