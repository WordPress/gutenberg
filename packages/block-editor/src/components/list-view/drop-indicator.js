/**
 * WordPress dependencies
 */
import { Popover } from '@wordpress/components';
import { getScrollContainer } from '@wordpress/dom';
import { useCallback, useMemo } from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';

export default function ListViewDropIndicator( {
	listViewRef,
	blockDropTarget,
} ) {
	const { rootClientId, clientId, dropPosition } = blockDropTarget || {};

	const [ rootBlockElement, blockElement ] = useMemo( () => {
		if ( ! listViewRef.current ) {
			return [];
		}

		// The rootClientId will be defined whenever dropping into inner
		// block lists, but is undefined when dropping at the root level.
		const _rootBlockElement = rootClientId
			? listViewRef.current.querySelector(
					`[data-block="${ rootClientId }"]`
			  )
			: undefined;

		// The clientId represents the sibling block, the dragged block will
		// usually be inserted adjacent to it. It will be undefined when
		// dropping a block into an empty block list.
		const _blockElement = clientId
			? listViewRef.current.querySelector(
					`[data-block="${ clientId }"]`
			  )
			: undefined;

		return [ _rootBlockElement, _blockElement ];
	}, [ rootClientId, clientId ] );

	// The targetElement is the element that the drop indicator will appear
	// before or after. When dropping into an empty block list, blockElement
	// is undefined, so the indicator will appear after the rootBlockElement.
	const targetElement = blockElement || rootBlockElement;

	const getDropIndicatorIndent = useCallback(
		( targetElementRect ) => {
			if ( ! rootBlockElement ) {
				return 0;
			}

			// Calculate the indent using the block icon of the root block.
			// Using a classname selector here might be flaky and could be
			// improved.
			const rootBlockIconElement = rootBlockElement.querySelector(
				'.block-editor-block-icon'
			);
			const rootBlockIconRect =
				rootBlockIconElement.getBoundingClientRect();
			return isRTL()
				? targetElementRect.right - rootBlockIconRect.left
				: rootBlockIconRect.right - targetElementRect.left;
		},
		[ rootBlockElement ]
	);

	const getDropIndicatorWidth = useCallback(
		( targetElementRect, indent ) => {
			if ( ! targetElement ) {
				return 0;
			}

			// Default to assuming that the width of the drop indicator
			// should be the same as the target element.
			let width = targetElement.offsetWidth;

			// In deeply nested lists, where a scrollbar is present,
			// the width of the drop indicator should be the width of
			// the scroll container, minus the distance from the left
			// edge of the scroll container to the left edge of the
			// target element.
			const scrollContainer = getScrollContainer(
				targetElement,
				'horizontal'
			);

			const ownerDocument = targetElement.ownerDocument;
			const windowScroll =
				scrollContainer === ownerDocument.body ||
				scrollContainer === ownerDocument.documentElement;

			if ( scrollContainer && ! windowScroll ) {
				const scrollContainerRect =
					scrollContainer.getBoundingClientRect();

				const distanceBetweenContainerAndTarget = isRTL()
					? scrollContainerRect.right - targetElementRect.right
					: targetElementRect.left - scrollContainerRect.left;

				if ( scrollContainer.clientWidth < width ) {
					width =
						scrollContainer.clientWidth -
						distanceBetweenContainerAndTarget;
				}
			}

			// Subtract the indent from the final width of the indicator.
			return width - indent;
		},
		[ targetElement ]
	);

	const style = useMemo( () => {
		if ( ! targetElement ) {
			return {};
		}

		const targetElementRect = targetElement.getBoundingClientRect();
		const indent = getDropIndicatorIndent( targetElementRect );

		return {
			width: getDropIndicatorWidth( targetElementRect, indent ),
		};
	}, [ getDropIndicatorIndent, getDropIndicatorWidth, targetElement ] );

	const popoverAnchor = useMemo( () => {
		const isValidDropPosition =
			dropPosition === 'top' ||
			dropPosition === 'bottom' ||
			dropPosition === 'inside';
		if ( ! targetElement || ! isValidDropPosition ) {
			return undefined;
		}

		const rtl = isRTL();
		const ownerDocument = targetElement.ownerDocument;

		return {
			ownerDocument,
			getBoundingClientRect() {
				const rect = targetElement.getBoundingClientRect();
				const indent = getDropIndicatorIndent( rect );
				// In RTL languages, the drop indicator should be positioned
				// to the left of the target element, with the width of the
				// indicator determining the indent at the right edge of the
				// target element. In LTR languages, the drop indicator should
				// end at the right edge of the target element, with the indent
				// added to the position of the left edge of the target element.
				let left = rtl ? rect.left : rect.left + indent;
				let top = 0;
				let bottom = 0;

				if ( rtl ) {
					// In deeply nested lists, where a scrollbar is present,
					// the width of the drop indicator should be the width of
					// the visible area of the scroll container. In RTL languages,
					// the left edge of the drop indicator line needs to be
					// offset by the distance the left edge of the target element
					// and the left edge of the scroll container.
					const scrollContainer = getScrollContainer(
						targetElement,
						'horizontal'
					);

					const windowScroll =
						scrollContainer === ownerDocument.body ||
						scrollContainer === ownerDocument.documentElement;

					// If the scroll container is not the window, offset the left position.
					if ( scrollContainer && ! windowScroll ) {
						const scrollContainerRect =
							scrollContainer.getBoundingClientRect();

						const leftEdgeDifference =
							rect.left - scrollContainerRect.left;

						const scrollbarWidth =
							scrollContainer.offsetWidth -
							scrollContainer.clientWidth;

						left = left - leftEdgeDifference + scrollbarWidth;
					}
				}

				if ( dropPosition === 'top' ) {
					top = rect.top;
					bottom = rect.top;
				} else {
					// `dropPosition` is either `bottom` or `inside`
					top = rect.bottom;
					bottom = rect.bottom;
				}

				const width = getDropIndicatorWidth( rect, indent );
				const height = bottom - top;

				return new window.DOMRect( left, top, width, height );
			},
		};
	}, [
		targetElement,
		dropPosition,
		getDropIndicatorIndent,
		getDropIndicatorWidth,
	] );

	if ( ! targetElement ) {
		return null;
	}

	return (
		<Popover
			animate={ false }
			anchor={ popoverAnchor }
			focusOnMount={ false }
			className="block-editor-list-view-drop-indicator"
			variant="unstyled"
		>
			<div
				style={ style }
				className="block-editor-list-view-drop-indicator__line"
			/>
		</Popover>
	);
}
