/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
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

const MAX_POPOVER_RECOMPUTE_COUNTER = Number.MAX_SAFE_INTEGER;

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
	const [ popoverRecomputeCounter, forcePopoverRecompute ] = useReducer(
		// Module is there to make sure that the counter doesn't overflow.
		( s ) => ( s + 1 ) % MAX_POPOVER_RECOMPUTE_COUNTER,
		0
	);

	const { orientation, rootClientId, isVisible } = useSelect(
		( select ) => {
			const {
				getBlockListSettings,
				getBlockRootClientId,
				isBlockVisible,
			} = select( blockEditorStore );

			const _rootClientId = getBlockRootClientId(
				previousClientId ?? nextClientId
			);
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

	const popoverAnchor = useMemo( () => {
		if (
			// popoverRecomputeCounter is by definition always equal or greater than 0.
			// This check is only there to satisfy the correctness of the
			// exhaustive-deps rule for the `useMemo` hook.
			popoverRecomputeCounter < 0 ||
			( ! previousElement && ! nextElement ) ||
			! isVisible
		) {
			return undefined;
		}

		const { ownerDocument } = previousElement || nextElement;

		return {
			ownerDocument,
			getBoundingClientRect() {
				const previousRect = previousElement
					? previousElement.getBoundingClientRect()
					: null;
				const nextRect = nextElement
					? nextElement.getBoundingClientRect()
					: null;

				let left = 0;
				let top = 0;
				let width = 0;
				let height = 0;

				if ( isVertical ) {
					// vertical
					top = previousRect ? previousRect.bottom : nextRect.top;
					width = previousRect ? previousRect.width : nextRect.width;
					height =
						nextRect && previousRect
							? nextRect.top - previousRect.bottom
							: 0;
					left = previousRect ? previousRect.left : nextRect.left;
				} else {
					top = previousRect ? previousRect.top : nextRect.top;
					height = previousRect
						? previousRect.height
						: nextRect.height;

					if ( isRTL() ) {
						// non vertical, rtl
						left = nextRect ? nextRect.right : previousRect.left;
						width =
							previousRect && nextRect
								? previousRect.left - nextRect.right
								: 0;
					} else {
						// non vertical, ltr
						left = previousRect
							? previousRect.right
							: nextRect.left;
						width =
							previousRect && nextRect
								? nextRect.left - previousRect.right
								: 0;
					}
				}

				return new window.DOMRect( left, top, width, height );
			},
		};
	}, [
		previousElement,
		nextElement,
		popoverRecomputeCounter,
		isVertical,
		isVisible,
	] );

	const popoverScrollRef = usePopoverScroll( __unstableContentRef );

	// This is only needed for a smooth transition when moving blocks.
	// When blocks are moved up/down, their position can be set by
	// updating the `transform` property manually (i.e. without using CSS
	// transitions or animations). The animation, which can also scroll the block
	// editor, can sometimes cause the position of the Popover to get out of sync.
	// A MutationObserver is therefore used to make sure that changes to the
	// selectedElement's attribute (i.e. `transform`) can be tracked and used to
	// trigger the Popover to rerender.
	useLayoutEffect( () => {
		if ( ! previousElement ) {
			return;
		}
		const observer = new window.MutationObserver( forcePopoverRecompute );
		observer.observe( previousElement, { attributes: true } );

		return () => {
			observer.disconnect();
		};
	}, [ previousElement ] );

	useLayoutEffect( () => {
		if ( ! nextElement ) {
			return;
		}
		const observer = new window.MutationObserver( forcePopoverRecompute );
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
			forcePopoverRecompute
		);
		return () => {
			previousElement.ownerDocument.defaultView?.removeEventListener(
				'resize',
				forcePopoverRecompute
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
			placement="overlay"
			variant="unstyled"
		>
			<div className="block-editor-block-popover__inbetween-container">
				{ children }
			</div>
		</Popover>
	);
	/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */
}

export default BlockPopoverInbetween;
