/**
 * WordPress dependencies
 */
import { Popover } from '@wordpress/components';
import { getScrollContainer } from '@wordpress/dom';
import { useCallback, useMemo } from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';

const DROP_INDICATOR_WIDTH = 4;

export default function ListViewDropIndicatorVertical( {
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
	}, [ listViewRef, rootClientId, clientId ] );

	// The targetElement is the element that the drop indicator will appear
	// before or after. When dropping into an empty block list, blockElement
	// is undefined, so the indicator will appear after the rootBlockElement.
	const targetElement = blockElement || rootBlockElement;

	const rtl = isRTL();

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
			return rtl
				? targetElementRect.right - rootBlockIconRect.left
				: rootBlockIconRect.right - targetElementRect.left;
		},
		[ rootBlockElement, rtl ]
	);

	const popoverAnchor = useMemo( () => {
		const isValidDropPosition =
			dropPosition === 'top' ||
			dropPosition === 'bottom' ||
			dropPosition === 'inside';
		if ( ! targetElement || ! isValidDropPosition ) {
			return undefined;
		}

		return {
			contextElement: targetElement,
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

				// In deeply nested lists, where a scrollbar is present,
				// the width of the drop indicator should be the width of
				// the visible area of the scroll container. Additionally,
				// the left edge of the drop indicator line needs to be
				// offset by the distance the left edge of the target element
				// and the left edge of the scroll container. The ensures
				// that the drop indicator position never breaks out of the
				// visible area of the scroll container.
				const scrollContainer = getScrollContainer(
					targetElement,
					'horizontal'
				);

				const doc = targetElement.ownerDocument;
				const windowScroll =
					scrollContainer === doc.body ||
					scrollContainer === doc.documentElement;

				// If the scroll container is not the window, offset the left position, if need be.
				if ( scrollContainer && ! windowScroll ) {
					const scrollContainerRect =
						scrollContainer.getBoundingClientRect();

					// In RTL languages, a vertical scrollbar is present on the
					// left edge of the scroll container. The width of the
					// scrollbar needs to be accounted for when positioning the
					// drop indicator.
					const scrollbarWidth = rtl
						? scrollContainer.offsetWidth -
						  scrollContainer.clientWidth
						: 0;

					if ( left < scrollContainerRect.left + scrollbarWidth ) {
						left = scrollContainerRect.left + scrollbarWidth;
					}
				}

				if ( dropPosition === 'top' ) {
					top = rect.top;
					top -= rect.height * 2;
				} else {
					// `dropPosition` is either `bottom` or `inside`
					top = rect.top;
				}

				const height = rect.height;

				return new window.DOMRect(
					left,
					top,
					DROP_INDICATOR_WIDTH,
					height
				);
			},
		};
	}, [ targetElement, dropPosition, getDropIndicatorIndent, rtl ] );

	if ( ! targetElement ) {
		return null;
	}

	return (
		<Popover
			animate={ false }
			anchor={ popoverAnchor }
			focusOnMount={ false }
			className="block-editor-list-view-drop-indicator--vertical"
			variant="unstyled"
		>
			<div className="block-editor-list-view-drop-indicator__line" />
		</Popover>
	);
}
