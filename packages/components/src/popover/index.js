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
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const [ animateOrigin, setAnimateOrigin ] = useState();

	useEffect( () => {
		if ( isMobileViewport && expandOnMobile ) {
			return;
		}

		const refresh = () => {
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

			anchor = addBuffer(
				anchor,
				anchorVerticalBuffer,
				anchorHorizontalBuffer
			);

			const contentSize = {
				height: contentRef.current.scrollHeight,
				width: contentRef.current.scrollWidth,
			};
			const {
				popoverTop,
				popoverLeft,
				xAxis,
				yAxis,
				contentHeight,
				contentWidth,
			} = computePopoverPosition( anchor, contentSize, position );

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

			containerRef.current.setAttribute( 'data-x-axis', xAxis );
			containerRef.current.setAttribute( 'data-y-axis', yAxis );
			containerRef.current.style.top = popoverTop + 'px';
			containerRef.current.style.left = popoverLeft + 'px';
			contentRef.current.style.maxHeight = contentHeight ? contentHeight + 'px' : '';
			contentRef.current.style.maxWidth = contentWidth ? contentWidth + 'px' : '';

			if ( xAxis === 'center' && yAxis === 'middle' ) {
				contentRef.current.classList.add( 'is-without-arrow' );
			} else {
				contentRef.current.classList.remove( 'is-without-arrow' );
			}

			setAnimateOrigin( animateXAxis + ' ' + animateYAxis );
		};

		refresh();

		/*
		 * There are sometimes we need to reposition or resize the popover that
		 * are not handled by the resize/scroll window events (i.e. CSS changes
		 * in the layout that changes the position of the anchor).
		 *
		 * For these situations, we refresh the popover every 0.5s
		 */
		const intervalHandle = window.setInterval( refresh, 500 );
		window.addEventListener( 'resize', refresh );
		window.addEventListener( 'scroll', refresh, true );

		return () => {
			window.clearInterval( intervalHandle );
			window.removeEventListener( 'resize', refresh );
			window.removeEventListener( 'scroll', refresh, true );
		};
	}, [
		isMobileViewport,
		expandOnMobile,
		anchorRect,
		getAnchorRect,
		anchorRef,
		shouldAnchorIncludePadding,
		anchorVerticalBuffer,
		anchorHorizontalBuffer,
		position,
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
								'is-mobile': isMobileViewport && expandOnMobile,
								'is-without-arrow': noArrow,
							}
						) }
						{ ...contentProps }
						onKeyDown={ maybeClose }
						ref={ containerRef }
					>
						{ isMobileViewport && expandOnMobile && (
							<div className="components-popover__header">
								<span className="components-popover__header-title">
									{ headerTitle }
								</span>
								<IconButton className="components-popover__close" icon="no-alt" onClick={ onClose } />
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
				if ( getSlot && getSlot( SLOT_NAME ) ) {
					content = <Fill name={ SLOT_NAME }>{ content }</Fill>;
				}

				return (
					<span ref={ anchorRefFallback }>
						{ content }
						{ isMobileViewport && expandOnMobile && <ScrollLock /> }
					</span>
				);
			} }
		</Consumer>
	);
};

const PopoverContainer = Popover;

PopoverContainer.Slot = () => <Slot bubblesVirtually name={ SLOT_NAME } />;

export default PopoverContainer;
