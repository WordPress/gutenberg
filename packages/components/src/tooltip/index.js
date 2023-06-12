// @ts-nocheck

/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	Children,
	cloneElement,
	concatChildren,
	useEffect,
	useState,
} from '@wordpress/element';
import { useDebounce, useMergeRefs } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Popover from '../popover';
import Shortcut from '../shortcut';

/**
 * Time over children to wait before showing tooltip
 *
 * @type {number}
 */
export const TOOLTIP_DELAY = 700;

const eventCatcher = <div className="event-catcher" />;

const getDisabledElement = ( {
	eventHandlers,
	child,
	childrenWithPopover,
	mergedRefs,
} ) => {
	return cloneElement(
		<span className="disabled-element-wrapper">
			{ cloneElement( eventCatcher, eventHandlers ) }
			{ cloneElement( child, {
				children: childrenWithPopover,
				ref: mergedRefs,
			} ) }
		</span>,
		{ ...eventHandlers }
	);
};

const getRegularElement = ( {
	child,
	eventHandlers,
	childrenWithPopover,
	mergedRefs,
} ) => {
	return cloneElement( child, {
		...eventHandlers,
		children: childrenWithPopover,
		ref: mergedRefs,
	} );
};

const addPopoverToGrandchildren = ( {
	anchor,
	grandchildren,
	isOver,
	offset,
	position,
	shortcut,
	text,
	className,
	...props
} ) =>
	concatChildren(
		grandchildren,
		isOver && (
			<Popover
				focusOnMount={ false }
				position={ position }
				className={ classNames( 'components-tooltip', className ) }
				aria-hidden="true"
				animate={ false }
				offset={ offset }
				anchor={ anchor }
				shift
				{ ...props }
			>
				{ text }
				<Shortcut
					className="components-tooltip__shortcut"
					shortcut={ shortcut }
				/>
			</Popover>
		)
	);

const emitToChild = ( children, eventName, event ) => {
	if ( Children.count( children ) !== 1 ) {
		return;
	}

	const child = Children.only( children );

	// If the underlying element is disabled, do not emit the event.
	if ( child.props.disabled ) {
		return;
	}

	if ( typeof child.props[ eventName ] === 'function' ) {
		child.props[ eventName ]( event );
	}
};

function Tooltip( props ) {
	const {
		children,
		position = 'bottom middle',
		text,
		shortcut,
		delay = TOOLTIP_DELAY,
		...popoverProps
	} = props;
	/**
	 * Whether a mouse is currently pressed, used in determining whether
	 * to handle a focus event as displaying the tooltip immediately.
	 *
	 * @type {boolean}
	 */
	const [ isMouseDown, setIsMouseDown ] = useState( false );
	const [ isOver, setIsOver ] = useState( false );
	const delayedSetIsOver = useDebounce( setIsOver, delay );
	// Using internal state (instead of a ref) for the popover anchor to make sure
	// that the component re-renders when the anchor updates.
	const [ popoverAnchor, setPopoverAnchor ] = useState( null );

	// Create a reference to the Tooltip's child, to be passed to the Popover
	// so that the Tooltip can be correctly positioned. Also, merge with the
	// existing ref for the first child, so that its ref is preserved.
	const existingChildRef = Children.toArray( children )[ 0 ]?.ref;
	const mergedChildRefs = useMergeRefs( [
		setPopoverAnchor,
		existingChildRef,
	] );

	const createMouseDown = ( event ) => {
		// In firefox, the mouse down event is also fired when the select
		// list is chosen.
		// Cancel further processing because re-rendering of child components
		// causes onChange to be triggered with the old value.
		// See https://github.com/WordPress/gutenberg/pull/42483
		if ( event.target.tagName === 'OPTION' ) {
			return;
		}

		// Preserve original child callback behavior.
		emitToChild( children, 'onMouseDown', event );

		// On mouse down, the next `mouseup` should revert the value of the
		// instance property and remove its own event handler. The bind is
		// made on the document since the `mouseup` might not occur within
		// the bounds of the element.
		document.addEventListener( 'mouseup', cancelIsMouseDown );
		setIsMouseDown( true );
	};

	const createMouseUp = ( event ) => {
		// In firefox, the mouse up event is also fired when the select
		// list is chosen.
		// Cancel further processing because re-rendering of child components
		// causes onChange to be triggered with the old value.
		// See https://github.com/WordPress/gutenberg/pull/42483
		if ( event.target.tagName === 'OPTION' ) {
			return;
		}

		emitToChild( children, 'onMouseUp', event );
		document.removeEventListener( 'mouseup', cancelIsMouseDown );
		setIsMouseDown( false );
	};

	const createMouseEvent = ( type ) => {
		if ( type === 'mouseUp' ) return createMouseUp;
		if ( type === 'mouseDown' ) return createMouseDown;
	};

	/**
	 * Prebound `isInMouseDown` handler, created as a constant reference to
	 * assure ability to remove in component unmount.
	 *
	 * @type {Function}
	 */
	const cancelIsMouseDown = createMouseEvent( 'mouseUp' );

	const createToggleIsOver = ( eventName, isDelayed ) => {
		return ( event ) => {
			// Preserve original child callback behavior.
			emitToChild( children, eventName, event );

			// Mouse events behave unreliably in React for disabled elements,
			// firing on mouseenter but not mouseleave.  Further, the default
			// behavior for disabled elements in some browsers is to ignore
			// mouse events. Don't bother trying to handle them.
			//
			// See: https://github.com/facebook/react/issues/4251
			if ( event.currentTarget.disabled ) {
				return;
			}

			// A focus event will occur as a result of a mouse click, but it
			// should be disambiguated between interacting with the button and
			// using an explicit focus shift as a cue to display the tooltip.
			if ( 'focus' === event.type && isMouseDown ) {
				return;
			}

			// Needed in case unsetting is over while delayed set pending, i.e.
			// quickly blur/mouseleave before delayedSetIsOver is called.
			delayedSetIsOver.cancel();

			const _isOver = [ 'focus', 'mouseenter' ].includes( event.type );
			if ( _isOver === isOver ) {
				return;
			}

			if ( isDelayed ) {
				delayedSetIsOver( _isOver );
			} else {
				setIsOver( _isOver );
			}
		};
	};
	const clearOnUnmount = () => {
		delayedSetIsOver.cancel();
		document.removeEventListener( 'mouseup', cancelIsMouseDown );
	};

	// Ignore reason: updating the deps array here could cause unexpected changes in behavior.
	// Deferring until a more detailed investigation/refactor can be performed.
	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect( () => clearOnUnmount, [] );

	if ( Children.count( children ) !== 1 ) {
		if ( 'development' === process.env.NODE_ENV ) {
			// eslint-disable-next-line no-console
			console.error(
				'Tooltip should be called with only a single child element.'
			);
		}

		return children;
	}

	const eventHandlers = {
		onMouseEnter: createToggleIsOver( 'onMouseEnter', true ),
		onMouseLeave: createToggleIsOver( 'onMouseLeave' ),
		onClick: createToggleIsOver( 'onClick' ),
		onFocus: createToggleIsOver( 'onFocus' ),
		onBlur: createToggleIsOver( 'onBlur' ),
		onMouseDown: createMouseEvent( 'mouseDown' ),
	};

	const child = Children.only( children );
	const { children: grandchildren, disabled } = child.props;
	const getElementWithPopover = disabled
		? getDisabledElement
		: getRegularElement;

	const popoverData = {
		anchor: popoverAnchor,
		isOver,
		offset: 4,
		position,
		shortcut,
		text,
	};
	const childrenWithPopover = addPopoverToGrandchildren( {
		grandchildren,
		...popoverData,
		...popoverProps,
	} );

	return getElementWithPopover( {
		child,
		eventHandlers,
		childrenWithPopover,
		mergedRefs: mergedChildRefs,
	} );
}

export default Tooltip;
