/**
 * External dependencies
 */
import classnames from 'classnames';
import isShallowEqual from '@wordpress/is-shallow-equal';

/**
 * WordPress dependencies
 */
import { Component, createRef } from '@wordpress/element';
import { focus } from '@wordpress/dom';
import { ESCAPE } from '@wordpress/keycodes';

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

const FocusManaged = withConstrainedTabbing( withFocusReturn( ( { children } ) => children ) );

/**
 * Name of slot in which popover should fill.
 *
 * @type {String}
 */
const SLOT_NAME = 'Popover';

class Popover extends Component {
	constructor() {
		super( ...arguments );

		this.getAnchorRect = this.getAnchorRect.bind( this );
		this.computePopoverPosition = this.computePopoverPosition.bind( this );
		this.maybeClose = this.maybeClose.bind( this );
		this.throttledRefresh = this.throttledRefresh.bind( this );
		this.refresh = this.refresh.bind( this );
		this.refreshOnAnchorMove = this.refreshOnAnchorMove.bind( this );

		this.contentNode = createRef();
		this.anchorNode = createRef();

		this.state = {
			popoverLeft: null,
			popoverTop: null,
			yAxis: 'top',
			xAxis: 'center',
			contentHeight: null,
			contentWidth: null,
			isMobile: false,
			popoverSize: null,
		};

		// Property used keep track of the previous anchor rect
		// used to compute the popover position and size.
		this.anchorRect = {};
	}

	componentDidMount() {
		this.toggleAutoRefresh( true );
		this.refresh();

		/*
		 * Without the setTimeout, the dom node is not being focused. Related:
		 * https://stackoverflow.com/questions/35522220/react-ref-with-focus-doesnt-work-without-settimeout-my-example
		 *
		 * TODO: Treat the cause, not the symptom.
		 */
		this.focusTimeout = setTimeout( () => {
			this.focus();
		}, 0 );
	}

	componentDidUpdate( prevProps ) {
		if ( prevProps.position !== this.props.position ) {
			this.computePopoverPosition( this.state.popoverSize, this.anchorRect );
		}
	}

	componentWillUnmount() {
		clearTimeout( this.focusTimeout );
		this.toggleAutoRefresh( false );
	}

	toggleAutoRefresh( isActive ) {
		window.cancelAnimationFrame( this.rafHandle );

		// Refresh the popover every time the window is resized or scrolled
		const handler = isActive ? 'addEventListener' : 'removeEventListener';
		window[ handler ]( 'resize', this.throttledRefresh );
		window[ handler ]( 'scroll', this.throttledRefresh, true );

		/*
		 * There are sometimes we need to reposition or resize the popover that are not
		 * handled by the resize/scroll window events (i.e. CSS changes in the layout
		 * that changes the position of the anchor).
		 *
		 * For these situations, we refresh the popover every 0.5s
		 */
		if ( isActive ) {
			this.autoRefresh = setInterval( this.refreshOnAnchorMove, 500 );
		} else {
			clearInterval( this.autoRefresh );
		}
	}

	throttledRefresh( event ) {
		window.cancelAnimationFrame( this.rafHandle );
		if ( event && event.type === 'scroll' && this.contentNode.current.contains( event.target ) ) {
			return;
		}
		this.rafHandle = window.requestAnimationFrame( this.refresh );
	}

	/**
	 * Calling refreshOnAnchorMove
	 * will only refresh the popover position if the anchor moves.
	 */
	refreshOnAnchorMove() {
		const { getAnchorRect = this.getAnchorRect } = this.props;
		const anchorRect = getAnchorRect( this.anchorNode.current );
		const didAnchorRectChange = ! isShallowEqual( anchorRect, this.anchorRect );
		if ( didAnchorRectChange ) {
			this.anchorRect = anchorRect;
			this.computePopoverPosition( this.state.popoverSize, anchorRect );
		}
	}

	/**
	 * Calling `refresh()` will force the Popover to recalculate its size and
	 * position. This is useful when a DOM change causes the anchor node to change
	 * position.
	 */
	refresh() {
		const { getAnchorRect = this.getAnchorRect } = this.props;
		const anchorRect = getAnchorRect( this.anchorNode.current );
		const contentRect = this.contentNode.current.getBoundingClientRect();
		const popoverSize = {
			width: contentRect.width,
			height: contentRect.height,
		};
		const didPopoverSizeChange = ! this.state.popoverSize || (
			popoverSize.width !== this.state.popoverSize.width ||
			popoverSize.height !== this.state.popoverSize.height
		);
		if ( didPopoverSizeChange ) {
			this.setState( { popoverSize } );
		}
		this.anchorRect = anchorRect;
		this.computePopoverPosition( popoverSize, anchorRect );
	}

	focus() {
		const { focusOnMount } = this.props;

		if ( ! focusOnMount || ! this.contentNode.current ) {
			return;
		}

		if ( focusOnMount === 'firstElement' ) {
			// Find first tabbable node within content and shift focus, falling
			// back to the popover panel itself.
			const firstTabbable = focus.tabbable.find( this.contentNode.current )[ 0 ];

			if ( firstTabbable ) {
				firstTabbable.focus();
			} else {
				this.contentNode.current.focus();
			}

			return;
		}

		if ( focusOnMount === 'container' ) {
			// Focus the popover panel itself so items in the popover are easily
			// accessed via keyboard navigation.
			this.contentNode.current.focus();
		}
	}

	getAnchorRect( anchor ) {
		if ( ! anchor || ! anchor.parentNode ) {
			return;
		}
		const rect = anchor.parentNode.getBoundingClientRect();
		// subtract padding
		const { paddingTop, paddingBottom } = window.getComputedStyle( anchor.parentNode );
		const topPad = parseInt( paddingTop, 10 );
		const bottomPad = parseInt( paddingBottom, 10 );
		return {
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

	computePopoverPosition( popoverSize, anchorRect ) {
		const { position = 'top', expandOnMobile } = this.props;
		const newPopoverPosition = computePopoverPosition(
			anchorRect,
			popoverSize,
			position,
			expandOnMobile
		);

		if (
			this.state.yAxis !== newPopoverPosition.yAxis ||
			this.state.xAxis !== newPopoverPosition.xAxis ||
			this.state.popoverLeft !== newPopoverPosition.popoverLeft ||
			this.state.popoverTop !== newPopoverPosition.popoverTop ||
			this.state.contentHeight !== newPopoverPosition.contentHeight ||
			this.state.contentWidth !== newPopoverPosition.contentWidth ||
			this.state.isMobile !== newPopoverPosition.isMobile
		) {
			this.setState( newPopoverPosition );
		}
	}

	maybeClose( event ) {
		const { onKeyDown, onClose } = this.props;

		// Close on escape
		if ( event.keyCode === ESCAPE && onClose ) {
			event.stopPropagation();
			onClose();
		}

		// Preserve original content prop behavior
		if ( onKeyDown ) {
			onKeyDown( event );
		}
	}

	render() {
		const {
			headerTitle,
			onClose,
			children,
			className,
			onClickOutside = onClose,
			noArrow,
			// Disable reason: We generate the `...contentProps` rest as remainder
			// of props which aren't explicitly handled by this component.
			/* eslint-disable no-unused-vars */
			position,
			range,
			focusOnMount,
			getAnchorRect,
			expandOnMobile,
			/* eslint-enable no-unused-vars */
			...contentProps
		} = this.props;
		const {
			popoverLeft,
			popoverTop,
			yAxis,
			xAxis,
			contentHeight,
			contentWidth,
			popoverSize,
			isMobile,
		} = this.state;

		const classes = classnames(
			'components-popover',
			className,
			'is-' + yAxis,
			'is-' + xAxis,
			{
				'is-mobile': isMobile,
				'is-without-arrow': noArrow || ( xAxis === 'center' && yAxis === 'middle' ),
			}
		);

		// Disable reason: We care to capture the _bubbled_ events from inputs
		// within popover as inferring close intent.

		/* eslint-disable jsx-a11y/no-static-element-interactions */
		let content = (
			<PopoverDetectOutside onClickOutside={ onClickOutside }>
				<IsolatedEventContainer
					className={ classes }
					style={ {
						top: ! isMobile && popoverTop ? popoverTop + 'px' : undefined,
						left: ! isMobile && popoverLeft ? popoverLeft + 'px' : undefined,
						visibility: popoverSize ? undefined : 'hidden',
					} }
					{ ...contentProps }
					onKeyDown={ this.maybeClose }
				>
					{ isMobile && (
						<div className="components-popover__header">
							<span className="components-popover__header-title">
								{ headerTitle }
							</span>
							<IconButton className="components-popover__close" icon="no-alt" onClick={ onClose } />
						</div>
					) }
					<div
						ref={ this.contentNode }
						className="components-popover__content"
						style={ {
							maxHeight: ! isMobile && contentHeight ? contentHeight + 'px' : undefined,
							maxWidth: ! isMobile && contentWidth ? contentWidth + 'px' : undefined,
						} }
						tabIndex="-1"
					>
						{ children }
					</div>
				</IsolatedEventContainer>
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
						<span ref={ this.anchorNode }>
							{ content }
							{ isMobile && expandOnMobile && <ScrollLock /> }
						</span>
					);
				} }
			</Consumer>
		);
	}
}

Popover.defaultProps = {
	focusOnMount: 'firstElement',
	noArrow: false,
};

const PopoverContainer = Popover;

PopoverContainer.Slot = () => <Slot bubblesVirtually name={ SLOT_NAME } />;

export default PopoverContainer;
