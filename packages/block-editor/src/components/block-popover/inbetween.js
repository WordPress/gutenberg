/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	useCallback,
	useMemo,
	createContext,
	useReducer,
	useLayoutEffect,
} from '@wordpress/element';
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
	// This is a temporary hack to get the inbetween inserter to recompute properly.
	const [ positionRecompute, forceRecompute ] = useReducer(
		( s ) => s + 1,
		0
	);

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
		[ previousClientId, nextClientId ]
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
				width: previousRect ? previousRect.width : nextRect.width,
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
			height: previousRect ? previousRect.height : nextRect.height,
		};
	}, [
		previousElement,
		nextElement,
		isVertical,
		positionRecompute,
		isVisible,
	] );

	const getAnchorRect = useCallback( () => {
		if ( ( ! previousElement && ! nextElement ) || ! isVisible ) {
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
					right: previousRect ? previousRect.right : nextRect.right,
					bottom: previousRect ? previousRect.bottom : nextRect.top,
					height: 0,
					width: 0,
					ownerDocument,
				};
			}

			return {
				top: previousRect ? previousRect.bottom : nextRect.top,
				left: previousRect ? previousRect.left : nextRect.left,
				right: previousRect ? previousRect.left : nextRect.left,
				bottom: previousRect ? previousRect.bottom : nextRect.top,
				height: 0,
				width: 0,
				ownerDocument,
			};
		}

		if ( isRTL() ) {
			return {
				top: previousRect ? previousRect.top : nextRect.top,
				left: previousRect ? previousRect.left : nextRect.right,
				right: previousRect ? previousRect.left : nextRect.right,
				bottom: previousRect ? previousRect.top : nextRect.top,
				height: 0,
				width: 0,
				ownerDocument,
			};
		}

		return {
			top: previousRect ? previousRect.top : nextRect.top,
			left: previousRect ? previousRect.right : nextRect.left,
			right: previousRect ? previousRect.right : nextRect.left,
			bottom: previousRect ? previousRect.left : nextRect.right,
			height: 0,
			width: 0,
			ownerDocument,
		};
	}, [ previousElement, nextElement, positionRecompute, isVisible ] );

	const popoverScrollRef = usePopoverScroll( __unstableContentRef );

	// This is only needed for a smooth transition when moving blocks.
	useLayoutEffect( () => {
		if ( ! previousElement ) {
			return;
		}
		const observer = new window.MutationObserver( forceRecompute );
		observer.observe( previousElement, { attributes: true } );

		return () => {
			observer.disconnect();
		};
	}, [ previousElement ] );

	useLayoutEffect( () => {
		if ( ! nextElement ) {
			return;
		}
		const observer = new window.MutationObserver( forceRecompute );
		observer.observe( nextElement, { attributes: true } );

		return () => {
			observer.disconnect();
		};
	}, [ nextElement ] );

	useLayoutEffect( () => {
		if ( ! previousElement ) {
			return;
		}
		previousElement.ownerDocument.defaultView.addEventListener(
			'resize',
			forceRecompute
		);
		return () => {
			previousElement.ownerDocument.defaultView.removeEventListener(
				'resize',
				forceRecompute
			);
		};
	}, [ previousElement ] );

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
			getAnchorRect={ getAnchorRect }
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
			placement="bottom-start"
		>
			<div
				className="block-editor-block-popover__inbetween-container"
				style={ style }
			>
				{ children }
			</div>
		</Popover>
	);
	/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */
}

export default BlockPopoverInbetween;
