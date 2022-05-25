// @ts-nocheck
/**
 * External dependencies
 */
import { includes } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	Children,
	cloneElement,
	concatChildren,
	useEffect,
	useState,
	useRef,
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

/**
 * Convert a position string to a placement string. This logic
 * is borrowed from the Popover component, with one key difference:
 *
 * Here, the 'left' position translates to the '-start' placement and
 * the 'right' position translates to the '-end' placement. This ensures
 * that the ToolTip is placed at the expected left/right location.
 *
 * @param {string} position A position string such as 'bottom left'
 * @return {string} A placement string such as 'bottom-start'
 */
const positionToPlacement = ( position ) => {
	const [ x, y, z ] = position.split( ' ' );

	if ( [ 'top', 'bottom' ].includes( x ) ) {
		let suffix = '';
		if ( ( !! z && z === 'left' ) || y === 'left' ) {
			suffix = '-start';
		} else if ( ( !! z && z === 'right' ) || y === 'right' ) {
			suffix = '-end';
		}
		return x + suffix;
	}

	return y;
};

const getDisabledElement = ( {
	eventHandlers,
	child,
	childrenWithPopover,
	anchorRef,
} ) => {
	return cloneElement(
		<span className="disabled-element-wrapper">
			{ cloneElement( eventCatcher, eventHandlers ) }
			{ cloneElement( child, {
				children: childrenWithPopover,
			} ) }
		</span>,
		{ ...eventHandlers, ref: anchorRef }
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
	anchorRef,
	grandchildren,
	isOver,
	offset,
	placement,
	shortcut,
	text,
} ) =>
	concatChildren(
		grandchildren,
		isOver && (
			<Popover
				focusOnMount={ false }
				placement={ placement }
				className="components-tooltip"
				aria-hidden="true"
				animate={ false }
				offset={ offset }
				anchorRef={ anchorRef }
				__unstableShift
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
		position = 'bottom right',
		text,
		shortcut,
		delay = TOOLTIP_DELAY,
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

	// Create a reference to the Tooltip's child, to be passed to the Popover
	// so that the Tooltip can be correctly positioned. Also, merge with the
	// existing ref for the first child, so that its ref is preserved.
	const childRef = useRef( null );
	const mergedChildRefs = useMergeRefs( [
		childRef,
		Children.toArray( children )[ 0 ]?.ref,
	] );

	const createMouseDown = ( event ) => {
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
			// mouse events. Don't bother trying to to handle them.
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

			const _isOver = includes( [ 'focus', 'mouseenter' ], event.type );
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

	// Transform the Tooltip's position property to the relevant
	// placement point to be passed to the Popover.
	const placement = positionToPlacement( position );

	// To adequately support the Tooltip's position property,
	// this function centers the Tooltip to the specified placement point.
	// For example, setting the "bottom left" position will center the Tooltip
	// at the bottom left corner of the Tooltip's first child.
	const positionOffset = ( { floating } ) =>
		floating?.width
			? {
					alignmentAxis: -floating.width / 2,
			  }
			: {};

	const popoverData = {
		anchorRef: childRef,
		isOver,
		offset: position ? positionOffset : undefined,
		placement,
		shortcut,
		text,
	};
	const childrenWithPopover = addPopoverToGrandchildren( {
		grandchildren,
		...popoverData,
	} );

	return getElementWithPopover( {
		child,
		eventHandlers,
		childrenWithPopover,
		anchorRef: childRef,
		mergedRefs: mergedChildRefs,
	} );
}

export default Tooltip;
