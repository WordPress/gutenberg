/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import createHigherOrderComponent from '../create-higher-order-component';

/**
 * A Higher Order Component used to change props passed to a component.
 *
 * @param {?function} propsMutationFunction Function that changes the props.
 *
 * @return {Component} Wrapped component.
 */
export default function withPropsChange( propsMutationFunction = noop ) {
	return createHigherOrderComponent( ( OriginalComponent ) => {
		return ( props ) => {
			return (
				<OriginalComponent
					{ ...propsMutationFunction( props ) }
				/>
			);
		};
	} );
}
