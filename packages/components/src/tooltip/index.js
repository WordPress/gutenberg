/**
 * External dependencies
 */
import { debounce, includes } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	Component,
	Children,
	cloneElement,
	concatChildren,
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
const TOOLTIP_DELAY = 700;

class Tooltip extends Component {
	constructor() {
		super( ...arguments );

		this.delayedSetIsOver = debounce(
			( isOver ) => this.setState( { isOver } ),
			TOOLTIP_DELAY
		);

		/**
		 * Prebound `isInMouseDown` handler, created as a constant reference to
		 * assure ability to remove in component unmount.
		 *
		 * @type {Function}
		 */
		this.cancelIsMouseDown = this.createSetIsMouseDown( false );

		/**
		 * Whether a the mouse is currently pressed, used in determining whether
		 * to handle a focus event as displaying the tooltip immediately.
		 *
		 * @type {boolean}
		 */
		this.isInMouseDown = false;

		this.state = {
			isOver: false,
		};
	}

	componentWillUnmount() {
		this.delayedSetIsOver.cancel();

		document.removeEventListener( 'mouseup', this.cancelIsMouseDown );
	}

	emitToChild( eventName, event ) {
		const { children } = this.props;
		if ( Children.count( children ) !== 1 ) {
			return;
		}

		const child = Children.only( children );
		if ( typeof child.props[ eventName ] === 'function' ) {
			child.props[ eventName ]( event );
		}
	}

	createToggleIsOver( eventName, isDelayed ) {
		return ( event ) => {
			// Preserve original child callback behavior
			this.emitToChild( eventName, event );

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
			if ( 'focus' === event.type && this.isInMouseDown ) {
				return;
			}

			// Needed in case unsetting is over while delayed set pending, i.e.
			// quickly blur/mouseleave before delayedSetIsOver is called
			this.delayedSetIsOver.cancel();

			const isOver = includes( [ 'focus', 'mouseenter' ], event.type );
			if ( isOver === this.state.isOver ) {
				return;
			}

			if ( isDelayed ) {
				this.delayedSetIsOver( isOver );
			} else {
				this.setState( { isOver } );
			}
		};
	}

	/**
	 * Creates an event callback to handle assignment of the `isInMouseDown`
	 * instance property in response to a `mousedown` or `mouseup` event.
	 *
	 * @param {boolean} isMouseDown Whether handler is to be created for the
	 *                              `mousedown` event, as opposed to `mouseup`.
	 *
	 * @return {Function} Event callback handler.
	 */
	createSetIsMouseDown( isMouseDown ) {
		return ( event ) => {
			// Preserve original child callback behavior
			this.emitToChild(
				isMouseDown ? 'onMouseDown' : 'onMouseUp',
				event
			);

			// On mouse down, the next `mouseup` should revert the value of the
			// instance property and remove its own event handler. The bind is
			// made on the document since the `mouseup` might not occur within
			// the bounds of the element.
			document[
				isMouseDown ? 'addEventListener' : 'removeEventListener'
			]( 'mouseup', this.cancelIsMouseDown );

			this.isInMouseDown = isMouseDown;
		};
	}

	render() {
		const { children, position, text, shortcut } = this.props;
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
		const { isOver } = this.state;
		return cloneElement( child, {
			onMouseEnter: this.createToggleIsOver( 'onMouseEnter', true ),
			onMouseLeave: this.createToggleIsOver( 'onMouseLeave' ),
			onClick: this.createToggleIsOver( 'onClick' ),
			onFocus: this.createToggleIsOver( 'onFocus' ),
			onBlur: this.createToggleIsOver( 'onBlur' ),
			onMouseDown: this.createSetIsMouseDown( true ),
			children: concatChildren(
				child.props.children,
				isOver && (
					<Popover
						focusOnMount={ false }
						position={ position }
						className="components-tooltip"
						aria-hidden="true"
						animate={ false }
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
}

export default Tooltip;
