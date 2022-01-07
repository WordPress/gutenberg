/**
 * WordPress dependencies
 */
import isShallowEqual from '@wordpress/is-shallow-equal';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import createHigherOrderComponent from '../../utils/create-higher-order-component';

/**
 * External dependencies
 */
import type { ComponentType, ComponentClass } from 'react';

/**
 * Given a component returns the enhanced component augmented with a component
 * only rerendering when its props/state change
 */
const pure = createHigherOrderComponent(
	< TProps, >( Wrapped: ComponentType< TProps > ) => {
		if ( Wrapped.prototype instanceof Component ) {
			return class extends ( Wrapped as ComponentClass< TProps > ) {
				shouldComponentUpdate( nextProps: TProps, nextState: any ) {
					return (
						! isShallowEqual( nextProps, this.props ) ||
						! isShallowEqual( nextState, this.state )
					);
				}
			};
		}

		return class extends Component< TProps > {
			shouldComponentUpdate( nextProps: TProps ) {
				return ! isShallowEqual( nextProps, this.props );
			}

			render() {
				return <Wrapped { ...this.props } />;
			}
		};
	},
	'pure'
);

export default pure;
