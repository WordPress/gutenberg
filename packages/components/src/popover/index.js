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

/**
 * Internal dependencies
 */
import { computePopoverPosition } from './utils';
import withFocusReturn from '../higher-order/with-focus-return';
import withConstrainedTabbing from '../higher-order/with-constrained-tabbing';
import PopoverDetectOutside from './detect-outside';
import IconButton from '../icon-button';
import ScrollLock from '../scroll-lock';
import IsolatedEventContainer from '../isolated-event-container';
import { Slot, Fill, Consumer } from '../slot-fill';
import Animate from '../animate';

const FocusManaged = withConstrainedTabbing( withFocusReturn( ( { children } ) => children ) );

/**
 * Name of slot in which popover should fill.
 *
 * @type {string}
 */
const SLOT_NAME = 'Popover';

/**
 * Hook used trigger an event handler once the window is resized or scrolled.
 *
 * @param {Function} handler              Event handler.
 * @param {Object}   ignoredScrollableRef scroll events inside this element are ignored.
 */
function useThrottledWindowScrollOrResize( handler, ignoredScrollableRef ) {
	// Refresh anchor rect on resize
	useEffect( () => {
		let refreshHandle;
		const throttledRefresh = ( event ) => {
			window.cancelAnimationFrame( refreshHandle );
			if ( ignoredScrollableRef && event && event.type === 'scroll' && ignoredScrollableRef.current.contains( event.target ) ) {
				return;
			}
			refreshHandle = window.requestAnimationFrame( handler );
		};

		window.addEventListener( 'resize', throttledRefresh );
		window.addEventListener( 'scroll', throttledRefresh, true );

		return () => {
			window.removeEventListener( 'resize', throttledRefresh );
			window.removeEventListener( 'scroll', throttledRefresh, true );
		};
	} );
}

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

		const rect = anchorRef.getBoundingClientRect();

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

function addBuffer( rect, verticalBuffer = 0, horizontalBuffer = 0 ) {
	return {
		x: rect.left - horizontalBuffer,
		y: rect.top - verticalBuffer,
		width: rect.width + ( 2 * horizontalBuffer ),
		height: rect.height + ( 2 * verticalBuffer ),
		left: rect.left - horizontalBuffer,
		right: rect.right + horizontalBuffer,
		top: rect.top - verticalBuffer,
		bottom: rect.bottom + verticalBuffer,
	};
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
 * Hook used to compute the initial size of an element.
 * The popover applies styling to limit the height of the element,
 * we only care about the initial size.
 *
 * @param {Object} ref Reference to the popover content element.
 *
 * @return {Object} Content size.
 */
function useInitialContentSize( ref ) {
	const [ contentSize, setContentSize ] = useState( null );
	useEffect( () => {
		const contentRect = ref.current.getBoundingClientRect();
		setContentSize( {
			width: contentRect.width,
			height: contentRect.height,
		} );
	}, [] );

	return contentSize;
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
				const firstTabbable = focus.tabbable.find( contentRef.current )[ 0 ];
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
	anchorVerticalBuffer,
	anchorHorizontalBuffer,
	anchorRect,
	getAnchorRect,
	expandOnMobile,
	animate = true,
	onClickOutside,
	onFocusOutside,
	/* eslint-enable no-unused-vars */
	...contentProps
} ) => {
	const anchorRefFallback = useRef( null );
	const contentRef = useRef( null );
	const containerRef = useRef();

	// Animation
	const [ isReadyToAnimate, setIsReadyToAnimate ] = useState( false );

	// Content size
	const contentSize = useInitialContentSize( contentRef );

	useEffect( () => {
		if ( contentSize ) {
			setIsReadyToAnimate( true );
		}
	}, [ contentSize ] );

	console.log( isReadyToAnimate );

	const refresh = () => {
		let anchor = computeAnchorRect(
			anchorRefFallback,
			anchorRect,
			getAnchorRect,
			anchorRef,
			shouldAnchorIncludePadding
		);

		anchor = addBuffer(
			anchor,
			anchorVerticalBuffer,
			anchorHorizontalBuffer
		);

		if ( ! anchor || ! contentSize ) {
			return;
		}

		const {
			isMobile,
			popoverTop,
			popoverLeft,
			xAxis,
			yAxis,
			contentHeight,
			contentWidth,
		} = computePopoverPosition(
			anchor,
			contentSize,
			position,
			expandOnMobile
		);

		if ( isMobile ) {
			return;
		}

		const classes = classnames(
			'components-popover',
			className,
			'is-' + yAxis,
			'is-' + xAxis,
			{
				'is-mobile': isMobile,
				'is-without-arrow': noArrow || (
					xAxis === 'center' &&
					yAxis === 'middle'
				),
			}
		);

		containerRef.current.className = classes;
		containerRef.current.style.top = popoverTop + 'px';
		containerRef.current.style.left = popoverLeft + 'px';
		contentRef.current.style.maxHeight = contentHeight + 'px';
		contentRef.current.style.maxWidth = contentWidth + 'px';
	};

	useEffect( refresh );
	useEffect( () => {
		if ( ! anchorRect ) {
			/*
			* There are sometimes we need to reposition or resize the popover that are not
			* handled by the resize/scroll window events (i.e. CSS changes in the layout
			* that changes the position of the anchor).
			*
			* For these situations, we refresh the popover every 0.5s
			*/
			const intervalHandle = setInterval( refresh, 500 );
			return () => clearInterval( intervalHandle );
		}
	}, [ anchorRect ] );

	useThrottledWindowScrollOrResize( refresh, contentRef );

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
			clickEvent.initMouseEvent( 'click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null );
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
				type={ animate && isReadyToAnimate ? 'appear' : null }
				// options={ { origin: animateYAxis + ' ' + animateXAxis } }
			>
				{ ( { className: animateClassName } ) => (
					// eslint-disable-next-line jsx-a11y/no-static-element-interactions
					<div
						className={ classnames( 'components-popover', className, animateClassName ) }
						style={ {
							visibility: contentSize ? undefined : 'hidden',
						} }
						{ ...contentProps }
						onKeyDown={ maybeClose }
						ref={ containerRef }
					>
						<IsolatedEventContainer>
							<div className="components-popover__header">
								<span className="components-popover__header-title">
									{ headerTitle }
								</span>
								<IconButton className="components-popover__close" icon="no-alt" onClick={ onClose } />
							</div>
							<div
								ref={ contentRef }
								className="components-popover__content"
								tabIndex="-1"
							>
								{ children }
							</div>
						</IsolatedEventContainer>
					</div>
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
				if ( getSlot && getSlot( SLOT_NAME ) ) {
					content = <Fill name={ SLOT_NAME }>{ content }</Fill>;
				}

				return (
					<span ref={ anchorRefFallback }>
						{ content }
					</span>
				);
			} }
		</Consumer>
	);
};

const PopoverContainer = Popover;

PopoverContainer.Slot = () => <Slot bubblesVirtually name={ SLOT_NAME } />;

export default PopoverContainer;
