/**
 * External dependencies
 */
import { debounce, includes } from 'lodash';

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

const emitToChild = ( children, eventName, event ) => {
	if ( Children.count( children ) !== 1 ) {
		return;
	}

	const child = Children.only( children );
	if ( typeof child.props[ eventName ] === 'function' ) {
		child.props[ eventName ]( event );
	}
};

function Tooltip( { children, position, text, shortcut } ) {
	/**
	 * Whether a mouse is currently pressed, used in determining whether
	 * to handle a focus event as displaying the tooltip immediately.
	 *
	 * @type {boolean}
	 */
	const [ isMouseDown, setIsMouseDown ] = useState( false );
	const [ isOver, setIsOver ] = useState( false );
	const delayedSetIsOver = debounce( setIsOver, TOOLTIP_DELAY );

	/**
	 * Creates an event callback to handle assignment of the `isInMouseDown`
	 * instance property in response to a `mousedown` or `mouseup` event.
	 *
	 * @param {boolean} isForMouseDown Whether handler is to be created for the
	 *                              `mousedown` event, as opposed to `mouseup`.
	 *
	 * @return {Function} Event callback handler.
	 */
	const createSetIsMouseDown = ( isForMouseDown ) => {
		const eventType = isForMouseDown ? 'onMouseDown' : 'onMouseUp';
		const eventListenerAction =
			( isForMouseDown ? 'add' : 'remove' ) + 'EventListener';
		return ( event ) => {
			// Preserve original child callback behavior
			emitToChild( children, eventType, event );

			// On mouse down, the next `mouseup` should revert the value of the
			// instance property and remove its own event handler. The bind is
			// made on the document since the `mouseup` might not occur within
			// the bounds of the element.
			document[ eventListenerAction ]( 'mouseup', cancelIsMouseDown );

			setIsMouseDown( isForMouseDown );
		};
	};

	/**
	 * Prebound `isInMouseDown` handler, created as a constant reference to
	 * assure ability to remove in component unmount.
	 *
	 * @type {Function}
	 */
	const cancelIsMouseDown = createSetIsMouseDown( false );

	const createToggleIsOver = ( eventName, isDelayed ) => {
		return ( event ) => {
			// Preserve original child callback behavior
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
			// quickly blur/mouseleave before delayedSetIsOver is called
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

	const child = Children.only( children );
	return cloneElement( child, {
		onMouseEnter: createToggleIsOver( 'onMouseEnter', true ),
		onMouseLeave: createToggleIsOver( 'onMouseLeave' ),
		onClick: createToggleIsOver( 'onClick' ),
		onFocus: createToggleIsOver( 'onFocus' ),
		onBlur: createToggleIsOver( 'onBlur' ),
		onMouseDown: createSetIsMouseDown( true ),
		children: concatChildren(
			child.props.children,
			isOver && (
				<Popover
					focusOnMount={ false }
					position={ position }
					className="components-tooltip"
					aria-hidden="true"
					animate={ false }
					noArrow={ true }
				>
					{ text }
					<Shortcut
						className="components-tooltip__shortcut"
						shortcut={ shortcut }
					/>
				</Popover>
			)
		),
	} );
}

export default Tooltip;
