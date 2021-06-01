/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import createHigherOrderComponent from '../../utils/create-higher-order-component';

/**
 * A Higher Order Component used to provide and manage internal component state
 * via props.
 *
 * @deprecated Use `useState` instead.
 *
 * @param {?Object} initialState Optional initial state of the component.
 *
 * @return {WPComponent} Wrapped component.
 */
export default function withState( initialState = {} ) {
	deprecated( 'wp.compose.withState', {
		since: '10.8',
		plugin: 'Gutenberg',
		alternative: 'wp.element.useState',
		version: '11.1',
	} );

	return createHigherOrderComponent( ( OriginalComponent ) => {
		return class WrappedComponent extends Component {
			constructor() {
				super( ...arguments );

				this.setState = this.setState.bind( this );

				this.state = initialState;
			}

			render() {
				return (
					<OriginalComponent
						{ ...this.props }
						{ ...this.state }
						setState={ this.setState }
					/>
				);
			}
		};
	}, 'withState' );
}
