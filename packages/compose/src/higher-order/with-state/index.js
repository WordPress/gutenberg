/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { createHigherOrderComponent } from '../../utils/create-higher-order-component';

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
		return function WrappedComponent( props ) {
			const [ state, setState ] = useState( initialState );

			return (
				<OriginalComponent
					{ ...props }
					{ ...state }
					setState={ setState }
				/>
			);
		};
	}, 'withState' );
}
