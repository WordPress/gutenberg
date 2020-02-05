/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useRef, useState, useEffect } from '@wordpress/element';
import { focus, getRectangleFromRange } from '@wordpress/dom';
import { ESCAPE } from '@wordpress/keycodes';
import deprecated from '@wordpress/deprecated';
import { useViewportMatch } from '@wordpress/compose';
import { close } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { computePopoverPosition } from './utils';
import withFocusReturn from '../higher-order/with-focus-return';
import withConstrainedTabbing from '../higher-order/with-constrained-tabbing';
import PopoverDetectOutside from './detect-outside';
import Button from '../button';
import ScrollLock from '../scroll-lock';
import IsolatedEventContainer from '../isolated-event-container';
import { Slot, Fill, Consumer } from '../slot-fill';
import Animate from '../animate';

const FocusManaged = withConstrainedTabbing(
	withFocusReturn( ( { children } ) => children )
);

/**
 * Name of slot in which popover should fill.
 *
 * @type {string}
 */
const SLOT_NAME = 'Popover';

function computeAnchorRect(
	anchorRefFallback,
	anchorRect,
	getAnchorRect,
	anchorRef = false,
	shouldAnchorIncludePadding
) {
	if ( anchorRect ) {
		return anchorRect;
	}

	if ( getAnchorRect ) {
		if ( ! anchorRefFallback.current ) {
			return;
		}

		return getAnchorRect( anchorRefFallback.current );
	}

	if ( anchorRef !== false ) {
		if ( ! anchorRef ) {
			return;
		}

		if ( anchorRef instanceof window.Range ) {
			return getRectangleFromRange( anchorRef );
		}

		if ( anchorRef instanceof window.Element ) {
			const rect = anchorRef.getBoundingClientRect();

			if ( shouldAnchorIncludePadding ) {
				return rect;
			}

			return withoutPadding( rect, anchorRef );
		}

		const { top, bottom } = anchorRef;
		const topRect = top.getBoundingClientRect();
		const bottomRect = bottom.getBoundingClientRect();
		const rect = new window.DOMRect(
			topRect.left,
			topRect.top,
			topRect.width,
			bottomRect.bottom - topRect.top
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
	const rect = parentNode.getBoundingClientRect();

	if ( shouldAnchorIncludePadding ) {
		return rect;
	}

	return withoutPadding( rect, parentNode );
}

function withoutPadding( rect, element ) {
	const {
		paddingTop,
		paddingBottom,
		paddingLeft,
		paddingRight,
	} = window.getComputedStyle( element );
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
 * Hook used to focus the first tabbable element on mount.
 *
 * @param {boolean|string} focusOnMount Focus on mount mode.
 * @param {Object}         contentRef   Reference to the popover content element.
 */
function useFocusContentOnMount( focusOnMount, contentRef ) {
	// Focus handling
	useEffect( () => {
		/*
		 * Without the setTimeout, the dom node is not being focused. Related:
		 * https://stackoverflow.com/questions/35522220/react-ref-with-focus-doesnt-work-without-settimeout-my-example
		 *
		 * TODO: Treat the cause, not the symptom.
		 */
		const focusTimeout = setTimeout( () => {
			if ( ! focusOnMount || ! contentRef.current ) {
				return;
			}

			if ( focusOnMount === 'firstElement' ) {
				// Find first tabbable node within content and shift focus, falling
				// back to the popover panel itself.
				const firstTabbable = focus.tabbable.find(
					contentRef.current
				)[ 0 ];

				if ( firstTabbable ) {
					firstTabbable.focus();
				} else {
					contentRef.current.focus();
				}

				return;
			}

			if ( focusOnMount === 'container' ) {
				// Focus the popover panel itself so items in the popover are easily
				// accessed via keyboard navigation.
				contentRef.current.focus();
			}
		}, 0 );

		return () => clearTimeout( focusTimeout );
	}, [] );
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

const Popover = ( {
	headerTitle,
	onClose,
	onKeyDown,
	children,
	className,
	noArrow = false,
	// Disable reason: We generate the `...contentProps` rest as remainder
	// of props which aren't explicitly handled by this component.
	/* eslint-disable no-unused-vars */
	position = 'top',
	range,
	focusOnMount = 'firstElement',
	anchorRef,
	shouldAnchorIncludePadding,
	anchorRect,
	getAnchorRect,
	expandOnMobile,
	animate = true,
	onClickOutside,
	onFocusOutside,
	__unstableSticky,
	__unstableSlotName = SLOT_NAME,
	__unstableAllowVerticalSubpixelPosition,
	__unstableAllowHorizontalSubpixelPosition,
	__unstableFixedPosition = true,
	/* eslint-enable no-unused-vars */
	...contentProps
} ) => {
	const anchorRefFallback = useRef( null );
	const contentRef = useRef( null );
	const containerRef = useRef();
	const contentRect = useRef();
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const [ animateOrigin, setAnimateOrigin ] = useState();
	const isExpanded = expandOnMobile && isMobileViewport;

	noArrow = isExpanded || noArrow;

	useEffect( () => {
		if ( isExpanded ) {
			setClass( containerRef.current, 'is-without-arrow', noArrow );
			setAttribute( containerRef.current, 'data-x-axis' );
			setAttribute( containerRef.current, 'data-y-axis' );
			setStyle( containerRef.current, 'top' );
			setStyle( containerRef.current, 'left' );
			setStyle( contentRef.current, 'maxHeight' );
			setStyle( contentRef.current, 'maxWidth' );
			setStyle( containerRef.current, 'position' );
			return;
		}

		const refresh = ( { subpixels } = {} ) => {
			if ( ! containerRef.current || ! contentRef.current ) {
				return;
			}

			let anchor = computeAnchorRect(
				anchorRefFallback,
				anchorRect,
				getAnchorRect,
				anchorRef,
				shouldAnchorIncludePadding
			);

			if ( ! anchor ) {
				return;
			}

			if ( ! contentRect.current ) {
				contentRect.current = contentRef.current.getBoundingClientRect();
			}

			let relativeOffsetTop = 0;

			// If there is a positioned ancestor element that is not the body,
			// subtract the position from the anchor rect. If the position of
			// the popover is fixed, the offset parent is null or the body
			// element, in which case the position is relative to the viewport.
			// See https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetParent
			if ( ! __unstableFixedPosition ) {
				setStyle( containerRef.current, 'position', 'absolute' );

				const { offsetParent } = containerRef.current;
				const offsetParentRect = offsetParent.getBoundingClientRect();

				relativeOffsetTop = offsetParentRect.top;
				anchor = new window.DOMRect(
					anchor.left - offsetParentRect.left,
					anchor.top - offsetParentRect.top,
					anchor.width,
					anchor.height
				);
			} else {
				setStyle( containerRef.current, 'position' );
			}

			const {
				popoverTop,
				popoverLeft,
				xAxis,
				yAxis,
				contentHeight,
				contentWidth,
			} = computePopoverPosition(
				anchor,
				contentRect.current,
				position,
				__unstableSticky,
				containerRef.current,
				relativeOffsetTop
			);

			if (
				typeof popoverTop === 'number' &&
				typeof popoverLeft === 'number'
			) {
				if ( subpixels && __unstableAllowVerticalSubpixelPosition ) {
					setStyle(
						containerRef.current,
						'left',
						popoverLeft + 'px'
					);
					setStyle( containerRef.current, 'top' );
					setStyle(
						containerRef.current,
						'transform',
						`translateY(${ popoverTop }px)`
					);
				} else if (
					subpixels &&
					__unstableAllowHorizontalSubpixelPosition
				) {
					setStyle( containerRef.current, 'top', popoverTop + 'px' );
					setStyle( containerRef.current, 'left' );
					setStyle(
						containerRef.current,
						'transform',
						`translate(${ popoverLeft }px)`
					);
				} else {
					setStyle( containerRef.current, 'top', popoverTop + 'px' );
					setStyle(
						containerRef.current,
						'left',
						popoverLeft + 'px'
					);
					setStyle( containerRef.current, 'transform' );
				}
			}

			setClass(
				containerRef.current,
				'is-without-arrow',
				noArrow || ( xAxis === 'center' && yAxis === 'middle' )
			);
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

		// Height may still adjust between now and the next tick.
		const timeoutId = window.setTimeout( refresh );

		/*
		 * There are sometimes we need to reposition or resize the popover that
		 * are not handled by the resize/scroll window events (i.e. CSS changes
		 * in the layout that changes the position of the anchor).
		 *
		 * For these situations, we refresh the popover every 0.5s
		 */
		const intervalHandle = window.setInterval( refresh, 500 );

		let rafId;

		const refreshOnAnimationFrame = () => {
			window.cancelAnimationFrame( rafId );
			rafId = window.requestAnimationFrame( refresh );
		};

		// Sometimes a click trigger a layout change that affects the popover
		// position. This is an opportunity to immediately refresh rather than
		// at the interval.
		window.addEventListener( 'click', refreshOnAnimationFrame );
		window.addEventListener( 'resize', refresh );
		window.addEventListener( 'scroll', refresh, true );

		let observer;

		const observeElement =
			__unstableAllowVerticalSubpixelPosition ||
			__unstableAllowHorizontalSubpixelPosition;

		if ( observeElement ) {
			observer = new window.MutationObserver( () =>
				refresh( { subpixels: true } )
			);
			observer.observe( observeElement, { attributes: true } );
		}

		return () => {
			window.clearTimeout( timeoutId );
			window.clearInterval( intervalHandle );
			window.removeEventListener( 'resize', refresh );
			window.removeEventListener( 'scroll', refresh, true );
			window.removeEventListener( 'click', refreshOnAnimationFrame );
			window.cancelAnimationFrame( rafId );

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
		__unstableSticky,
		__unstableAllowVerticalSubpixelPosition,
		__unstableAllowHorizontalSubpixelPosition,
	] );

	useFocusContentOnMount( focusOnMount, contentRef );

	// Event handlers
	const maybeClose = ( event ) => {
		// Close on escape
		if ( event.keyCode === ESCAPE && onClose ) {
			event.stopPropagation();
			onClose();
		}

		// Preserve original content prop behavior
		if ( onKeyDown ) {
			onKeyDown( event );
		}
	};

	/**
	 * Shims an onFocusOutside callback to be compatible with a deprecated
	 * onClickOutside prop function, if provided.
	 *
	 * @param {FocusEvent} event Focus event from onFocusOutside.
	 */
	function handleOnFocusOutside( event ) {
		// Defer to given `onFocusOutside` if specified. Call `onClose` only if
		// both `onFocusOutside` and `onClickOutside` are unspecified. Doing so
		// assures backwards-compatibility for prior `onClickOutside` default.
		if ( onFocusOutside ) {
			onFocusOutside( event );
			return;
		} else if ( ! onClickOutside ) {
			if ( onClose ) {
				onClose();
			}
			return;
		}

		// Simulate MouseEvent using FocusEvent#relatedTarget as emulated click
		// target. MouseEvent constructor is unsupported in Internet Explorer.
		let clickEvent;
		try {
			clickEvent = new window.MouseEvent( 'click' );
		} catch ( error ) {
			clickEvent = document.createEvent( 'MouseEvent' );
			clickEvent.initMouseEvent(
				'click',
				true,
				true,
				window,
				0,
				0,
				0,
				0,
				0,
				false,
				false,
				false,
				false,
				0,
				null
			);
		}

		Object.defineProperty( clickEvent, 'target', {
			get: () => event.relatedTarget,
		} );

		deprecated( 'Popover onClickOutside prop', {
			alternative: 'onFocusOutside',
		} );

		onClickOutside( clickEvent );
	}

	// Disable reason: We care to capture the _bubbled_ events from inputs
	// within popover as inferring close intent.

	let content = (
		<PopoverDetectOutside onFocusOutside={ handleOnFocusOutside }>
			<Animate
				type={ animate && animateOrigin ? 'appear' : null }
				options={ { origin: animateOrigin } }
			>
				{ ( { className: animateClassName } ) => (
					<IsolatedEventContainer
						className={ classnames(
							'components-popover',
							className,
							animateClassName,
							{
								'is-expanded': isExpanded,
								'is-without-arrow': noArrow,
							}
						) }
						{ ...contentProps }
						onKeyDown={ maybeClose }
						ref={ containerRef }
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
						<div
							ref={ contentRef }
							className="components-popover__content"
							tabIndex="-1"
						>
							{ children }
						</div>
					</IsolatedEventContainer>
				) }
			</Animate>
		</PopoverDetectOutside>
	);

	// Apply focus to element as long as focusOnMount is truthy; false is
	// the only "disabled" value.
	if ( focusOnMount ) {
		content = <FocusManaged>{ content }</FocusManaged>;
	}

	return (
		<Consumer>
			{ ( { getSlot } ) => {
				// In case there is no slot context in which to render,
				// default to an in-place rendering.
				if ( getSlot && getSlot( __unstableSlotName ) ) {
					content = (
						<Fill name={ __unstableSlotName }>{ content }</Fill>
					);
				}

				if ( anchorRef || anchorRect ) {
					return content;
				}

				return <span ref={ anchorRefFallback }>{ content }</span>;
			} }
		</Consumer>
	);
};

const PopoverContainer = Popover;

PopoverContainer.Slot = ( { name = SLOT_NAME } ) => (
	<Slot bubblesVirtually name={ name } />
);

export default PopoverContainer;
