/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalTruncate as Truncate,
	Popover,
} from '@wordpress/components';

import { getScrollContainer } from '@wordpress/dom';
import { useCallback, useMemo } from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import useBlockDisplayInformation from '../use-block-display-information';
import useBlockDisplayTitle from '../block-title/use-block-display-title';
import ListViewExpander from './expander';

export default function ListViewDropIndicatorPreview( {
	draggedBlockClientId,
	listViewRef,
	blockDropTarget,
} ) {
	const blockInformation = useBlockDisplayInformation( draggedBlockClientId );
	const blockTitle = useBlockDisplayTitle( {
		clientId: draggedBlockClientId,
		context: 'list-view',
	} );

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

				const scrollContainerWidth = scrollContainer.clientWidth;

				if (
					scrollContainerWidth <
					width + distanceBetweenContainerAndTarget
				) {
					width =
						scrollContainerWidth -
						distanceBetweenContainerAndTarget;
				}

				// LTR logic for ensuring the drop indicator does not extend
				// beyond the right edge of the scroll container.
				if (
					! rtl &&
					targetElementRect.left + indent < scrollContainerRect.left
				) {
					width -= scrollContainerRect.left - targetElementRect.left;
					return width;
				}

				// RTL logic for ensuring the drop indicator does not extend
				// beyond the right edge of the scroll container.
				if (
					rtl &&
					targetElementRect.right - indent > scrollContainerRect.right
				) {
					width -=
						targetElementRect.right - scrollContainerRect.right;
					return width;
				}
			}

			// Subtract the indent from the final width of the indicator.
			return width - indent;
		},
		[ rtl, targetElement ]
	);

	const style = useMemo( () => {
		if ( ! targetElement ) {
			return {};
		}

		const targetElementRect = targetElement.getBoundingClientRect();

		return {
			width: getDropIndicatorWidth( targetElementRect, 0 ),
		};
	}, [ getDropIndicatorWidth, targetElement ] );

	const horizontalScrollOffsetStyle = useMemo( () => {
		if ( ! targetElement ) {
			return {};
		}

		const scrollContainer = getScrollContainer( targetElement );
		const ownerDocument = targetElement.ownerDocument;
		const windowScroll =
			scrollContainer === ownerDocument.body ||
			scrollContainer === ownerDocument.documentElement;

		if ( scrollContainer && ! windowScroll ) {
			const scrollContainerRect = scrollContainer.getBoundingClientRect();
			const targetElementRect = targetElement.getBoundingClientRect();

			const distanceBetweenContainerAndTarget = rtl
				? scrollContainerRect.right - targetElementRect.right
				: targetElementRect.left - scrollContainerRect.left;

			if ( ! rtl && scrollContainerRect.left > targetElementRect.left ) {
				return {
					transform: `translateX( ${ distanceBetweenContainerAndTarget }px )`,
				};
			}

			if ( rtl && scrollContainerRect.right < targetElementRect.right ) {
				return {
					transform: `translateX( ${
						distanceBetweenContainerAndTarget * -1
					}px )`,
				};
			}
		}

		return {};
	}, [ rtl, targetElement ] );

	const ariaLevel = useMemo( () => {
		if ( ! rootBlockElement ) {
			return 1;
		}

		const _ariaLevel = parseInt(
			rootBlockElement.getAttribute( 'aria-level' ),
			10
		);

		return _ariaLevel ? _ariaLevel + 1 : 1;
	}, [ rootBlockElement ] );

	const hasAdjacentSelectedBranch = useMemo( () => {
		if ( ! targetElement ) {
			return false;
		}

		return targetElement.classList.contains( 'is-branch-selected' );
	}, [ targetElement ] );

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
				// In RTL languages, the drop indicator should be positioned
				// to the left of the target element, with the width of the
				// indicator determining the indent at the right edge of the
				// target element. In LTR languages, the drop indicator should
				// end at the right edge of the target element, with the indent
				// added to the position of the left edge of the target element.
				// let left = rtl ? rect.left : rect.left + indent;
				let left = rect.left;
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
					top = rect.top - rect.height * 2;
				} else {
					// `dropPosition` is either `bottom` or `inside`
					top = rect.top;
				}

				const width = getDropIndicatorWidth( rect, 0 );
				const height = rect.height;

				return new window.DOMRect( left, top, width, height );
			},
		};
	}, [ targetElement, dropPosition, getDropIndicatorWidth, rtl ] );

	if ( ! targetElement ) {
		return null;
	}

	return (
		<Popover
			animate={ false }
			anchor={ popoverAnchor }
			focusOnMount={ false }
			className="block-editor-list-view-drop-indicator--preview"
			variant="unstyled"
			flip={ false }
			resize
		>
			<div
				style={ style }
				className={ clsx(
					'block-editor-list-view-drop-indicator__line',
					{
						'block-editor-list-view-drop-indicator__line--darker':
							hasAdjacentSelectedBranch,
					}
				) }
			>
				<div
					className="block-editor-list-view-leaf"
					aria-level={ ariaLevel }
				>
					<div
						className={ clsx(
							'block-editor-list-view-block-select-button',
							'block-editor-list-view-block-contents'
						) }
						style={ horizontalScrollOffsetStyle }
					>
						<ListViewExpander onClick={ () => {} } />
						<BlockIcon
							icon={ blockInformation?.icon }
							showColors
							context="list-view"
						/>
						<HStack
							alignment="center"
							className="block-editor-list-view-block-select-button__label-wrapper"
							justify="flex-start"
							spacing={ 1 }
						>
							<span className="block-editor-list-view-block-select-button__title">
								<Truncate ellipsizeMode="auto">
									{ blockTitle }
								</Truncate>
							</span>
						</HStack>
					</div>
					<div className="block-editor-list-view-block__menu-cell"></div>
				</div>
			</div>
		</Popover>
	);
}
