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
 * @param {any} initialState Optional initial state of the component.
 *
 * @return {any} A higher order component wrapper accepting a component that takes the state props + its own props + `setState` and returning a component that only accepts the own props.
 */
export default function withState( initialState = {} ) {
	deprecated( 'wp.compose.withState', {
		since: '5.8',
		alternative: 'wp.element.useState',
	} );

	return createHigherOrderComponent( ( OriginalComponent ) => {
		return class WrappedComponent extends Component {
			constructor( /** @type {any} */ props ) {
				super( props );

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
