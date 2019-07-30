/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useRef, useState, useEffect } from '@wordpress/element';
import { focus } from '@wordpress/dom';
import { ESCAPE } from '@wordpress/keycodes';
import isShallowEqual from '@wordpress/is-shallow-equal';

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
 * @type {String}
 */
const SLOT_NAME = 'Popover';

/**
 * Hook used trigger an event handler once the window is resized or scrolled.
 *
 * @param {function} handler              Event handler.
 * @param {Object}   ignoredScrollalbeRef scroll events inside this element are ignored.
 */
function useThrottledWindowScrollOrResize( handler, ignoredScrollalbeRef ) {
	// Refresh anchor rect on resize
	useEffect( () => {
		let refreshHandle;
		const throttledRefresh = ( event ) => {
			window.cancelAnimationFrame( refreshHandle );
			if ( ignoredScrollalbeRef && event && event.type === 'scroll' && ignoredScrollalbeRef.current.contains( event.target ) ) {
				return;
			}
			refreshHandle = window.requestAnimationFrame( handler );
		};

		window.addEventListener( 'resize', throttledRefresh );
		window.addEventListener( 'scroll', throttledRefresh );

		return () => {
			window.removeEventListener( 'resize', throttledRefresh );
			window.removeEventListener( 'scroll', throttledRefresh );
		};
	}, [] );
}

/**
 * Hook used to compute and update the anchor position properly.
 *
 * @param {Object} anchorRef       reference to the popover anchor element.
 * @param {Object} contentRef      reference to the popover content element.
 * @param {Object} anchorRect      anchor Rect prop used to override the computed value.
 * @param {Function} getAnchorRect function used to override the anchor value computation algorithm.
 *
 * @return {Object} Anchor position.
 */
function useAnchor( anchorRef, contentRef, anchorRect, getAnchorRect ) {
	const [ anchor, setAnchor ] = useState( null );
	const refreshAnchorRect = () => {
		if ( ! anchorRef.current ) {
			return;
		}

		let newAnchor;
		if ( anchorRect ) {
			newAnchor = anchorRect;
		} else if ( getAnchorRect ) {
			newAnchor = getAnchorRect( anchorRef.current );
		} else {
			const rect = anchorRef.current.parentNode.getBoundingClientRect();
			// subtract padding
			const { paddingTop, paddingBottom } = window.getComputedStyle( anchorRef.current.parentNode );
			const topPad = parseInt( paddingTop, 10 );
			const bottomPad = parseInt( paddingBottom, 10 );
			newAnchor = {
				x: rect.left,
				y: rect.top + topPad,
				width: rect.width,
				height: rect.height - topPad - bottomPad,
				left: rect.left,
				right: rect.right,
				top: rect.top + topPad,
				bottom: rect.bottom - bottomPad,
			};
		}

		const didAnchorRectChange = ! isShallowEqual( newAnchor, anchor );
		if ( didAnchorRectChange ) {
			setAnchor( newAnchor );
		}
	};
	useEffect( refreshAnchorRect, [ anchorRect, getAnchorRect ] );
	useEffect( () => {
		if ( ! anchorRect ) {
			/*
			* There are sometimes we need to reposition or resize the popover that are not
			* handled by the resize/scroll window events (i.e. CSS changes in the layout
			* that changes the position of the anchor).
			*
			* For these situations, we refresh the popover every 0.5s
			*/
			const intervalHandle = setInterval( refreshAnchorRect, 500 );

			return () => clearInterval( intervalHandle );
		}
	}, [ anchorRect ] );

	useThrottledWindowScrollOrResize( refreshAnchorRect, contentRef );

	return anchor;
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
 * Hook used to compute and update the position of the popover
 * based on the anchor position and the content size.
 *
 * @param {Object} anchor          Anchor Position.
 * @param {Object} contentSize     Content Size.
 * @param {string} position        Position prop.
 * @param {boolean} expandOnMobile Whether to show the popover full width on mobile.
 * @param {Object} contentRef      Reference to the popover content element.
 *
 * @return {Object} Popover position.
 */
function usePopoverPosition( anchor, contentSize, position, expandOnMobile, contentRef ) {
	const [ popoverPosition, setPopoverPosition ] = useState( {
		popoverLeft: null,
		popoverTop: null,
		yAxis: 'top',
		xAxis: 'center',
		contentHeight: null,
		contentWidth: null,
		isMobile: false,
	} );
	const refreshPopoverPosition = () => {
		if ( ! anchor || ! contentSize ) {
			return;
		}

		const newPopoverPosition = computePopoverPosition(
			anchor,
			contentSize,
			position,
			expandOnMobile
		);

		if (
			popoverPosition.yAxis !== newPopoverPosition.yAxis ||
			popoverPosition.xAxis !== newPopoverPosition.xAxis ||
			popoverPosition.popoverLeft !== newPopoverPosition.popoverLeft ||
			popoverPosition.popoverTop !== newPopoverPosition.popoverTop ||
			popoverPosition.contentHeight !== newPopoverPosition.contentHeight ||
			popoverPosition.contentWidth !== newPopoverPosition.contentWidth ||
			popoverPosition.isMobile !== newPopoverPosition.isMobile
		) {
			setPopoverPosition( newPopoverPosition );
		}
	};
	useEffect( refreshPopoverPosition, [ anchor, contentSize ] );
	useThrottledWindowScrollOrResize( refreshPopoverPosition, contentRef );

	return popoverPosition;
}

/**
 * Hook used to focus the first tabbable element on mount.
 *
 * @param {boolean|string} focusOnMount Focus on mount mode.
 * @param {Object} contentRef           Reference to the popover content element.
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
	onClickOutside = onClose,
	noArrow = false,
	// Disable reason: We generate the `...contentProps` rest as remainder
	// of props which aren't explicitly handled by this component.
	/* eslint-disable no-unused-vars */
	position = 'top',
	range,
	focusOnMount = 'firstElement',
	anchorRect,
	getAnchorRect,
	expandOnMobile,
	animate = true,
	/* eslint-enable no-unused-vars */
	...contentProps
} ) => {
	const anchorRef = useRef( null );
	const contentRef = useRef( null );

	// Animation
	const [ isReadyToAnimate, setIsReadyToAnimate ] = useState( false );

	// Anchor position
	const anchor = useAnchor( anchorRef, contentRef, anchorRect, getAnchorRect );

	// Content size
	const contentSize = useInitialContentSize( contentRef );
	useEffect( () => {
		if ( contentSize ) {
			setIsReadyToAnimate( true );
		}
	}, [ contentSize ] );

	// Compute the position
	const popoverPosition = usePopoverPosition(
		anchor,
		contentSize,
		position,
		expandOnMobile,
		contentRef
	);

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

	// Compute the animation position
	const yAxisMapping = {
		top: 'bottom',
		bottom: 'top',
	};
	const xAxisMapping = {
		left: 'right',
		right: 'left',
	};
	const animateYAxis = yAxisMapping[ popoverPosition.yAxis ] || 'middle';
	const animateXAxis = xAxisMapping[ popoverPosition.xAxis ] || 'center';

	const classes = classnames(
		'components-popover',
		className,
		'is-' + popoverPosition.yAxis,
		'is-' + popoverPosition.xAxis,
		{
			'is-mobile': popoverPosition.isMobile,
			'is-without-arrow': noArrow || (
				popoverPosition.xAxis === 'center' &&
				popoverPosition.yAxis === 'middle'
			),
		}
	);

	// Disable reason: We care to capture the _bubbled_ events from inputs
	// within popover as inferring close intent.

	/* eslint-disable jsx-a11y/no-static-element-interactions */
	let content = (
		<PopoverDetectOutside onClickOutside={ onClickOutside }>
			<Animate
				type={ animate && isReadyToAnimate ? 'appear' : null }
				options={ { origin: animateYAxis + ' ' + animateXAxis } }
			>
				{ ( { className: animateClassName } ) => (
					<IsolatedEventContainer
						className={ classnames( classes, animateClassName ) }
						style={ {
							top: ! popoverPosition.isMobile && popoverPosition.popoverTop ? popoverPosition.popoverTop + 'px' : undefined,
							left: ! popoverPosition.isMobile && popoverPosition.popoverLeft ? popoverPosition.popoverLeft + 'px' : undefined,
							visibility: contentSize ? undefined : 'hidden',
						} }
						{ ...contentProps }
						onKeyDown={ maybeClose }
					>
						{ popoverPosition.isMobile && (
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
							style={ {
								maxHeight: ! popoverPosition.isMobile && popoverPosition.contentHeight ? popoverPosition.contentHeight + 'px' : undefined,
								maxWidth: ! popoverPosition.isMobile && popoverPosition.contentWidth ? popoverPosition.contentWidth + 'px' : undefined,
							} }
							tabIndex="-1"
						>
							{ children }
						</div>
					</IsolatedEventContainer>
				) }
			</Animate>
		</PopoverDetectOutside>
	);
	/* eslint-enable jsx-a11y/no-static-element-interactions */

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
					<span ref={ anchorRef }>
						{ content }
						{ popoverPosition.isMobile && expandOnMobile && <ScrollLock /> }
					</span>
				);
			} }
		</Consumer>
	);
};

const PopoverContainer = Popover;

PopoverContainer.Slot = () => <Slot bubblesVirtually name={ SLOT_NAME } />;

export default PopoverContainer;
