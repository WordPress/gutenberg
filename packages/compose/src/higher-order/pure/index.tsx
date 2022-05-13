/**
 * External dependencies
 */
import type { ComponentClass, ComponentProps, ComponentType } from 'react';

/**
 * WordPress dependencies
 */
import isShallowEqual from '@wordpress/is-shallow-equal';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { createHigherOrderComponent } from '../../utils/create-higher-order-component';

/**
 * Given a component returns the enhanced component augmented with a component
 * only re-rendering when its props/state change
 */
const pure = createHigherOrderComponent(
	< Props extends ComponentProps< any >, State = any >(
		Wrapped: ComponentType< Props >
	): ComponentType< Props > => {
		if ( Wrapped.prototype instanceof Component ) {
			return class extends ( Wrapped as ComponentClass< Props, State > ) {
				shouldComponentUpdate(
					nextProps: Readonly< Props >,
					nextState: Readonly< State >
				) {
					return (
						! isShallowEqual( nextProps, this.props ) ||
						! isShallowEqual( nextState, this.state )
					);
				}
			};
		}

		return class extends Component< Props > {
			shouldComponentUpdate( nextProps: Readonly< Props > ) {
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
