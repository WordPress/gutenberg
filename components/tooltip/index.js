/**
 * External dependencies
 */
import { includes } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, Children, cloneElement, concatChildren } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import Popover from '../popover';

class Tooltip extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			isOver: false,
		};
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

	createToggleIsOver( eventName ) {
		return ( event ) => {
			const isOver = includes( [ 'focus', 'mouseover' ], event.type );
			if ( isOver === this.state.isOver ) {
				return;
			}

			this.setState( { isOver } );
			this.emitToChild( eventName, event );
		};
	}

	render() {
		const { children, position, text } = this.props;
		if ( Children.count( children ) !== 1 ) {
			if ( 'development' === process.env.NODE_ENV ) {
				// eslint-disable-next-line no-console
				console.error( 'Tooltip should be called with only a single child element.' );
			}

			return children;
		}

		const child = Children.only( children );
		const { isOver } = this.state;
		return cloneElement( child, {
			onMouseOver: this.createToggleIsOver( 'onMouseOver' ),
			onMouseOut: this.createToggleIsOver( 'onMouseOut' ),
			onFocus: this.createToggleIsOver( 'onFocus' ),
			onBlur: this.createToggleIsOver( 'onBlur' ),
			children: concatChildren(
				child.props.children,
				<Popover
					isOpen={ isOver }
					position={ position }
					className="components-tooltip"
					aria-hidden="true"
					tabIndex={ undefined }
				>
					{ text }
				</Popover>,
			),
		} );
	}
}

export default Tooltip;
