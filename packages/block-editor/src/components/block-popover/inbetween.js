/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo, createContext } from '@wordpress/element';
import { Popover } from '@wordpress/components';
import { isRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { __unstableUseBlockElement as useBlockElement } from '../block-list/use-block-props/use-block-refs';
import usePopoverScroll from './use-popover-scroll';

export const InsertionPointOpenRef = createContext();

function BlockPopoverInbetween( {
	previousClientId,
	nextClientId,
	children,
	__unstablePopoverSlot,
	__unstableContentRef,
	...props
} ) {
	const { orientation, rootClientId, isVisible } = useSelect(
		( select ) => {
			const {
				getBlockListSettings,
				getBlockRootClientId,
				isBlockVisible,
			} = select( blockEditorStore );

			const _rootClientId = getBlockRootClientId( previousClientId );
			return {
				orientation:
					getBlockListSettings( _rootClientId )?.orientation ||
					'vertical',
				rootClientId: _rootClientId,
				isVisible:
					isBlockVisible( previousClientId ) &&
					isBlockVisible( nextClientId ),
			};
		},
		[ previousClientId ]
	);
	const previousElement = useBlockElement( previousClientId );
	const nextElement = useBlockElement( nextClientId );
	const isVertical = orientation === 'vertical';
	const style = useMemo( () => {
		if ( ( ! previousElement && ! nextElement ) || ! isVisible ) {
			return {};
		}

		const previousRect = previousElement
			? previousElement.getBoundingClientRect()
			: null;
		const nextRect = nextElement
			? nextElement.getBoundingClientRect()
			: null;

		if ( isVertical ) {
			return {
				width: previousElement
					? previousElement.offsetWidth
					: nextElement.offsetWidth,
				height:
					nextRect && previousRect
						? nextRect.top - previousRect.bottom
						: 0,
			};
		}

		let width = 0;
		if ( previousRect && nextRect ) {
			width = isRTL()
				? previousRect.left - nextRect.right
				: nextRect.left - previousRect.right;
		}

		return {
			width,
			height: previousElement
				? previousElement.offsetHeight
				: nextElement.offsetHeight,
		};
	}, [ previousElement, nextElement, isVertical ] );

	const popoverAnchor = useMemo( () => {
		if ( ( ! previousElement && ! nextElement ) || ! isVisible ) {
			return undefined;
		}

		const { ownerDocument } = previousElement || nextElement;

		return {
			ownerDocument,
			getBoundingClientRect() {
				const prevRect = previousElement
					? previousElement.getBoundingClientRect()
					: null;
				const nextRect = nextElement
					? nextElement.getBoundingClientRect()
					: null;

				let left = 0;
				let top = 0;

				if ( isVertical ) {
					// vertical
					top = prevRect ? prevRect.bottom : nextRect.top;

					if ( isRTL() ) {
						// vertical, rtl
						left = prevRect ? prevRect.right : nextRect.right;
					} else {
						// vertical, ltr
						left = prevRect ? prevRect.left : nextRect.left;
					}
				} else {
					top = prevRect ? prevRect.top : nextRect.top;

					if ( isRTL() ) {
						// non vertical, rtl
						left = prevRect ? prevRect.left : nextRect.right;
					} else {
						// non vertical, ltr
						left = prevRect ? prevRect.right : nextRect.left;
					}
				}

				return new window.DOMRect( left, top, 0, 0 );
			},
		};
	}, [ previousElement, nextElement, isVisible ] );

	const popoverScrollRef = usePopoverScroll( __unstableContentRef );

	// If there's either a previous or a next element, show the inbetween popover.
	// Note that drag and drop uses the inbetween popover to show the drop indicator
	// before the first block and after the last block.
	if ( ( ! previousElement && ! nextElement ) || ! isVisible ) {
		return null;
	}

	/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */
	// While ideally it would be enough to capture the
	// bubbling focus event from the Inserter, due to the
	// characteristics of click focusing of `button`s in
	// Firefox and Safari, it is not reliable.
	//
	// See: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#Clicking_and_focus
	return (
		<Popover
			ref={ popoverScrollRef }
			animate={ false }
			anchor={ popoverAnchor }
			focusOnMount={ false }
			// Render in the old slot if needed for backward compatibility,
			// otherwise render in place (not in the default popover slot).
			__unstableSlotName={ __unstablePopoverSlot || null }
			// Forces a remount of the popover when its position changes
			// This makes sure the popover doesn't animate from its previous position.
			key={ nextClientId + '--' + rootClientId }
			{ ...props }
			className={ classnames(
				'block-editor-block-popover',
				'block-editor-block-popover__inbetween',
				props.className
			) }
			resize={ false }
			flip={ false }
		>
			<div style={ style }>{ children }</div>
		</Popover>
	);
	/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */
}

export default BlockPopoverInbetween;
