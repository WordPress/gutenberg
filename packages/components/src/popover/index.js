// @ts-nocheck
/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	useRef,
	useState,
	useLayoutEffect,
	forwardRef,
	createContext,
	useContext,
} from '@wordpress/element';
import { getRectangleFromRange } from '@wordpress/dom';
import {
	useViewportMatch,
	useResizeObserver,
	useMergeRefs,
	__experimentalUseDialog as useDialog,
} from '@wordpress/compose';
import { close } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { computePopoverPosition, offsetIframe } from './utils';
import Button from '../button';
import ScrollLock from '../scroll-lock';
import { Slot, Fill, useSlot } from '../slot-fill';
import { getAnimateClassName } from '../animate';

/**
 * Name of slot in which popover should fill.
 *
 * @type {string}
 */
const SLOT_NAME = 'Popover';

const slotNameContext = createContext();

function computeAnchorRect(
	anchorRefFallback,
	anchorRect,
	getAnchorRect,
	anchorRef = false,
	shouldAnchorIncludePadding,
	container
) {
	if ( anchorRect ) {
		return anchorRect;
	}

	if ( getAnchorRect ) {
		if ( ! anchorRefFallback.current ) {
			return;
		}

		const rect = getAnchorRect( anchorRefFallback.current );
		return offsetIframe(
			rect,
			rect.ownerDocument || anchorRefFallback.current.ownerDocument,
			container
		);
	}

	if ( anchorRef !== false ) {
		if (
			! anchorRef ||
			! window.Range ||
			! window.Element ||
			! window.DOMRect
		) {
			return;
		}

		// Duck-type to check if `anchorRef` is an instance of Range
		// `anchorRef instanceof window.Range` checks will break across document boundaries
		// such as in an iframe
		if ( typeof anchorRef?.cloneRange === 'function' ) {
			return offsetIframe(
				getRectangleFromRange( anchorRef ),
				anchorRef.endContainer.ownerDocument,
				container
			);
		}

		// Duck-type to check if `anchorRef` is an instance of Element
		// `anchorRef instanceof window.Element` checks will break across document boundaries
		// such as in an iframe
		if ( typeof anchorRef?.getBoundingClientRect === 'function' ) {
			const rect = offsetIframe(
				anchorRef.getBoundingClientRect(),
				anchorRef.ownerDocument,
				container
			);

			if ( shouldAnchorIncludePadding ) {
				return rect;
			}

			return withoutPadding( rect, anchorRef );
		}

		const { top, bottom } = anchorRef;
		const topRect = top.getBoundingClientRect();
		const bottomRect = bottom.getBoundingClientRect();
		const rect = offsetIframe(
			new window.DOMRect(
				topRect.left,
				topRect.top,
				topRect.width,
				bottomRect.bottom - topRect.top
			),
			top.ownerDocument,
			container
		);

		if ( shouldAnchorIncludePadding ) {
			return rect;
		}

		return withoutPadding( rect, anchorRef );
	}

	if ( ! anchorRefFallback.current ) {
		return;
	}

	const { parentNode } = anchorRefFallback.current;
	const rect = offsetIframe(
		parentNode.getBoundingClientRect(),
		parentNode.ownerDocument,
		container
	);

	if ( shouldAnchorIncludePadding ) {
		return rect;
	}

	return withoutPadding( rect, parentNode );
}

function getComputedStyle( node ) {
	return node.ownerDocument.defaultView.getComputedStyle( node );
}

function withoutPadding( rect, element ) {
	const {
		paddingTop,
		paddingBottom,
		paddingLeft,
		paddingRight,
	} = getComputedStyle( element );
	const top = paddingTop ? parseInt( paddingTop, 10 ) : 0;
	const bottom = paddingBottom ? parseInt( paddingBottom, 10 ) : 0;
	const left = paddingLeft ? parseInt( paddingLeft, 10 ) : 0;
	const right = paddingRight ? parseInt( paddingRight, 10 ) : 0;

	return {
		x: rect.left + left,
		y: rect.top + top,
		width: rect.width - left - right,
		height: rect.height - top - bottom,
		left: rect.left + left,
		right: rect.right - right,
		top: rect.top + top,
		bottom: rect.bottom - bottom,
	};
}

/**
 * Sets or removes an element attribute.
 *
 * @param {Element} element The element to modify.
 * @param {string}  name    The attribute name to set or remove.
 * @param {?string} value   The value to set. A falsy value will remove the
 *                          attribute.
 */
function setAttribute( element, name, value ) {
	if ( ! value ) {
		if ( element.hasAttribute( name ) ) {
			element.removeAttribute( name );
		}
	} else if ( element.getAttribute( name ) !== value ) {
		element.setAttribute( name, value );
	}
}

/**
 * Sets or removes an element style property.
 *
 * @param {Element} element  The element to modify.
 * @param {string}  property The property to set or remove.
 * @param {?string} value    The value to set. A falsy value will remove the
 *                           property.
 */
function setStyle( element, property, value = '' ) {
	if ( element.style[ property ] !== value ) {
		element.style[ property ] = value;
	}
}

/**
 * Sets or removes an element class.
 *
 * @param {Element} element The element to modify.
 * @param {string}  name    The class to set or remove.
 * @param {boolean} toggle  True to set the class, false to remove.
 */
function setClass( element, name, toggle ) {
	if ( toggle ) {
		if ( ! element.classList.contains( name ) ) {
			element.classList.add( name );
		}
	} else if ( element.classList.contains( name ) ) {
		element.classList.remove( name );
	}
}

function getAnchorDocument( anchor ) {
	if ( ! anchor ) {
		return;
	}

	if ( anchor.endContainer ) {
		return anchor.endContainer.ownerDocument;
	}

	if ( anchor.top ) {
		return anchor.top.ownerDocument;
	}

	return anchor.ownerDocument;
}

const Popover = (
	{
		headerTitle,
		onClose,
		children,
		className,
		noArrow = true,
		isAlternate,
		// Disable reason: We generate the `...contentProps` rest as remainder
		// of props which aren't explicitly handled by this component.
		/* eslint-disable no-unused-vars */
		position = 'bottom right',
		range,
		focusOnMount = 'firstElement',
		anchorRef,
		shouldAnchorIncludePadding,
		anchorRect,
		getAnchorRect,
		expandOnMobile,
		animate = true,
		onFocusOutside,
		__unstableStickyBoundaryElement,
		__unstableSlotName = SLOT_NAME,
		__unstableObserveElement,
		__unstableBoundaryParent,
		__unstableForcePosition,
		__unstableForceXAlignment,
		__unstableEditorCanvasWrapper,
		/* eslint-enable no-unused-vars */
		...contentProps
	},
	ref
) => {
	const anchorRefFallback = useRef( null );
	const contentRef = useRef( null );
	const containerRef = useRef();
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const [ animateOrigin, setAnimateOrigin ] = useState();
	const slotName = useContext( slotNameContext ) || __unstableSlotName;
	const slot = useSlot( slotName );
	const isExpanded = expandOnMobile && isMobileViewport;
	const [ containerResizeListener, contentSize ] = useResizeObserver();
	noArrow = isExpanded || noArrow;

	useLayoutEffect( () => {
		if ( isExpanded ) {
			setClass( containerRef.current, 'is-without-arrow', noArrow );
			setClass( containerRef.current, 'is-alternate', isAlternate );
			setAttribute( containerRef.current, 'data-x-axis' );
			setAttribute( containerRef.current, 'data-y-axis' );
			setStyle( containerRef.current, 'top' );
			setStyle( containerRef.current, 'left' );
			setStyle( contentRef.current, 'maxHeight' );
			setStyle( contentRef.current, 'maxWidth' );
			return;
		}

		const refresh = () => {
			if ( ! containerRef.current || ! contentRef.current ) {
				return;
			}

			let anchor = computeAnchorRect(
				anchorRefFallback,
				anchorRect,
				getAnchorRect,
				anchorRef,
				shouldAnchorIncludePadding,
				containerRef.current
			);

			if ( ! anchor ) {
				return;
			}

			const { offsetParent, ownerDocument } = containerRef.current;

			let relativeOffsetTop = 0;

			// If there is a positioned ancestor element that is not the body,
			// subtract the position from the anchor rect. If the position of
			// the popover is fixed, the offset parent is null or the body
			// element, in which case the position is relative to the viewport.
			// See https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetParent
			if ( offsetParent && offsetParent !== ownerDocument.body ) {
				const offsetParentRect = offsetParent.getBoundingClientRect();

				relativeOffsetTop = offsetParentRect.top;
				anchor = new window.DOMRect(
					anchor.left - offsetParentRect.left,
					anchor.top - offsetParentRect.top,
					anchor.width,
					anchor.height
				);
			}

			let boundaryElement;
			if ( __unstableBoundaryParent ) {
				boundaryElement = containerRef.current.parentElement;
			}

			const usedContentSize = ! contentSize.height
				? contentRef.current.getBoundingClientRect()
				: contentSize;

			const {
				popoverTop,
				popoverLeft,
				xAxis,
				yAxis,
				contentHeight,
				contentWidth,
			} = computePopoverPosition(
				anchor,
				usedContentSize,
				position,
				__unstableStickyBoundaryElement,
				containerRef.current,
				relativeOffsetTop,
				boundaryElement,
				__unstableForcePosition,
				__unstableForceXAlignment,
				__unstableEditorCanvasWrapper
			);

			if (
				typeof popoverTop === 'number' &&
				typeof popoverLeft === 'number'
			) {
				setStyle( containerRef.current, 'top', popoverTop + 'px' );
				setStyle( containerRef.current, 'left', popoverLeft + 'px' );
			}

			setClass(
				containerRef.current,
				'is-without-arrow',
				noArrow || ( xAxis === 'center' && yAxis === 'middle' )
			);
			setClass( containerRef.current, 'is-alternate', isAlternate );
			setAttribute( containerRef.current, 'data-x-axis', xAxis );
			setAttribute( containerRef.current, 'data-y-axis', yAxis );
			setStyle(
				contentRef.current,
				'maxHeight',
				typeof contentHeight === 'number' ? contentHeight + 'px' : ''
			);
			setStyle(
				contentRef.current,
				'maxWidth',
				typeof contentWidth === 'number' ? contentWidth + 'px' : ''
			);

			// Compute the animation position
			const yAxisMapping = {
				top: 'bottom',
				bottom: 'top',
			};
			const xAxisMapping = {
				left: 'right',
				right: 'left',
			};
			const animateYAxis = yAxisMapping[ yAxis ] || 'middle';
			const animateXAxis = xAxisMapping[ xAxis ] || 'center';

			setAnimateOrigin( animateXAxis + ' ' + animateYAxis );
		};

		refresh();

		const { ownerDocument } = containerRef.current;
		const { defaultView } = ownerDocument;

		/*
		 * There are sometimes we need to reposition or resize the popover that
		 * are not handled by the resize/scroll window events (i.e. CSS changes
		 * in the layout that changes the position of the anchor).
		 *
		 * For these situations, we refresh the popover every 0.5s
		 */
		const intervalHandle = defaultView.setInterval( refresh, 500 );

		let rafId;

		const refreshOnAnimationFrame = () => {
			defaultView.cancelAnimationFrame( rafId );
			rafId = defaultView.requestAnimationFrame( refresh );
		};

		// Sometimes a click trigger a layout change that affects the popover
		// position. This is an opportunity to immediately refresh rather than
		// at the interval.
		defaultView.addEventListener( 'click', refreshOnAnimationFrame );
		defaultView.addEventListener( 'resize', refresh );
		defaultView.addEventListener( 'scroll', refresh, true );

		const anchorDocument = getAnchorDocument( anchorRef );

		// If the anchor is within an iframe, the popover position also needs
		// to refrest when the iframe content is scrolled or resized.
		if ( anchorDocument && anchorDocument !== ownerDocument ) {
			anchorDocument.defaultView.addEventListener( 'resize', refresh );
			anchorDocument.defaultView.addEventListener(
				'scroll',
				refresh,
				true
			);
		}

		let observer;

		if ( __unstableObserveElement ) {
			observer = new defaultView.MutationObserver( refresh );
			observer.observe( __unstableObserveElement, { attributes: true } );
		}

		return () => {
			defaultView.clearInterval( intervalHandle );
			defaultView.removeEventListener( 'resize', refresh );
			defaultView.removeEventListener( 'scroll', refresh, true );
			defaultView.removeEventListener( 'click', refreshOnAnimationFrame );
			defaultView.cancelAnimationFrame( rafId );

			if ( anchorDocument && anchorDocument !== ownerDocument ) {
				anchorDocument.defaultView?.removeEventListener(
					'resize',
					refresh
				);
				anchorDocument.defaultView?.removeEventListener(
					'scroll',
					refresh,
					true
				);
			}

			if ( observer ) {
				observer.disconnect();
			}
		};
	}, [
		isExpanded,
		anchorRect,
		getAnchorRect,
		anchorRef,
		shouldAnchorIncludePadding,
		position,
		contentSize,
		__unstableStickyBoundaryElement,
		__unstableObserveElement,
		__unstableBoundaryParent,
	] );

	const onDialogClose = ( type, event ) => {
		// Ideally the popover should have just a single onClose prop and
		// not three props that potentially do the same thing.
		if ( type === 'focus-outside' && onFocusOutside ) {
			onFocusOutside( event );
		} else if ( onClose ) {
			onClose();
		}
	};

	const [ dialogRef, dialogProps ] = useDialog( {
		focusOnMount,
		__unstableOnClose: onDialogClose,
		onClose: onDialogClose,
	} );

	const mergedRefs = useMergeRefs( [ containerRef, dialogRef, ref ] );

	/** @type {false | string} */
	const animateClassName =
		Boolean( animate && animateOrigin ) &&
		getAnimateClassName( {
			type: 'appear',
			origin: animateOrigin,
		} );

	// Disable reason: We care to capture the _bubbled_ events from inputs
	// within popover as inferring close intent.

	let content = (
		// eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			className={ classnames(
				'components-popover',
				className,
				animateClassName,
				{
					'is-expanded': isExpanded,
					'is-without-arrow': noArrow,
					'is-alternate': isAlternate,
				}
			) }
			{ ...contentProps }
			ref={ mergedRefs }
			{ ...dialogProps }
			tabIndex="-1"
		>
			{ isExpanded && <ScrollLock /> }
			{ isExpanded && (
				<div className="components-popover__header">
					<span className="components-popover__header-title">
						{ headerTitle }
					</span>
					<Button
						className="components-popover__close"
						icon={ close }
						onClick={ onClose }
					/>
				</div>
			) }
			<div ref={ contentRef } className="components-popover__content">
				<div style={ { position: 'relative' } }>
					{ containerResizeListener }
					{ children }
				</div>
			</div>
		</div>
	);

	if ( slot.ref ) {
		content = <Fill name={ slotName }>{ content }</Fill>;
	}

	if ( anchorRef || anchorRect ) {
		return content;
	}

	return <span ref={ anchorRefFallback }>{ content }</span>;
};

const PopoverContainer = forwardRef( Popover );

function PopoverSlot( { name = SLOT_NAME }, ref ) {
	return (
		<Slot
			bubblesVirtually
			name={ name }
			className="popover-slot"
			ref={ ref }
		/>
	);
}

PopoverContainer.Slot = forwardRef( PopoverSlot );
PopoverContainer.__unstableSlotNameProvider = slotNameContext.Provider;

export default PopoverContainer;
