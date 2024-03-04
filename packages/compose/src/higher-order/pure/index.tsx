/**
 * External dependencies
 */
import type { ComponentType, ComponentClass } from 'react';

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
 *
 * @deprecated Use `memo` or `PureComponent` instead.
 */
const pure = createHigherOrderComponent( function < Props extends {} >(
	WrappedComponent: ComponentType< Props >
): ComponentType< Props > {
	if ( WrappedComponent.prototype instanceof Component ) {
		return class extends ( WrappedComponent as ComponentClass< Props > ) {
			shouldComponentUpdate( nextProps: Props, nextState: any ) {
				return (
					! isShallowEqual( nextProps, this.props ) ||
					! isShallowEqual( nextState, this.state )
				);
			}
		};
	}

	return class extends Component< Props > {
		shouldComponentUpdate( nextProps: Props ) {
			return ! isShallowEqual( nextProps, this.props );
		}

		render() {
			return <WrappedComponent { ...this.props } />;
		}
	};
}, 'pure' );

export default pure;
