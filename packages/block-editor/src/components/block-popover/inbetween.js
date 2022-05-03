/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useCallback, useMemo, createContext } from '@wordpress/element';
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
	const { orientation, rootClientId } = useSelect(
		( select ) => {
			const { getBlockListSettings, getBlockRootClientId } = select(
				blockEditorStore
			);

			const _rootClientId = getBlockRootClientId( previousClientId );
			return {
				orientation:
					getBlockListSettings( _rootClientId )?.orientation ||
					'vertical',
				rootClientId: _rootClientId,
			};
		},
		[ previousClientId ]
	);
	const previousElement = useBlockElement( previousClientId );
	const nextElement = useBlockElement( nextClientId );
	const isVertical = orientation === 'vertical';
	const style = useMemo( () => {
		if ( ! previousElement && ! nextElement ) {
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

	const getAnchorRect = useCallback( () => {
		if ( ! previousElement && ! nextElement ) {
			return {};
		}

		const { ownerDocument } = previousElement || nextElement;

		const previousRect = previousElement
			? previousElement.getBoundingClientRect()
			: null;
		const nextRect = nextElement
			? nextElement.getBoundingClientRect()
			: null;

		if ( isVertical ) {
			if ( isRTL() ) {
				return {
					top: previousRect ? previousRect.bottom : nextRect.top,
					left: previousRect ? previousRect.right : nextRect.right,
					right: previousRect ? previousRect.left : nextRect.left,
					bottom: nextRect ? nextRect.top : previousRect.bottom,
					ownerDocument,
				};
			}

			return {
				top: previousRect ? previousRect.bottom : nextRect.top,
				left: previousRect ? previousRect.left : nextRect.left,
				right: previousRect ? previousRect.right : nextRect.right,
				bottom: nextRect ? nextRect.top : previousRect.bottom,
				ownerDocument,
			};
		}

		if ( isRTL() ) {
			return {
				top: previousRect ? previousRect.top : nextRect.top,
				left: previousRect ? previousRect.left : nextRect.right,
				right: nextRect ? nextRect.right : previousRect.left,
				bottom: previousRect ? previousRect.bottom : nextRect.bottom,
				ownerDocument,
			};
		}

		return {
			top: previousRect ? previousRect.top : nextRect.top,
			left: previousRect ? previousRect.right : nextRect.left,
			right: nextRect ? nextRect.left : previousRect.right,
			bottom: previousRect ? previousRect.bottom : nextRect.bottom,
			ownerDocument,
		};
	}, [ previousElement, nextElement ] );

	const popoverScrollRef = usePopoverScroll( __unstableContentRef );

	if ( ! previousElement || ! nextElement ) {
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
			noArrow
			animate={ false }
			getAnchorRect={ getAnchorRect }
			focusOnMount={ false }
			// Render in the old slot if needed for backward compatibility,
			// otherwise render in place (not in the the default popover slot).
			__unstableSlotName={ __unstablePopoverSlot || null }
			// Forces a remount of the popover when its position changes
			// This makes sure the popover doesn't animate from its previous position.
			key={ nextClientId + '--' + rootClientId }
			{ ...props }
			className={ classnames(
				'block-editor-block-popover',
				props.className
			) }
		>
			<div style={ style }>{ children }</div>
		</Popover>
	);
	/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */
}

export default BlockPopoverInbetween;
