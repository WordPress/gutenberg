/**
 * WordPress dependencies
 */
import isShallowEqual from '@wordpress/is-shallow-equal';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	PropsOf,
	createHigherOrderComponent,
} from '../../utils/create-higher-order-component';

/**
 * External dependencies
 */
import type { ComponentType } from 'react';

/**
 * Given a component returns the enhanced component augmented with a component
 * only re-rendering when its props/state change
 */
const pure: < Inner extends ComponentType< any > >(
	Inner: Inner
) => ComponentType< PropsOf< Inner > > = createHigherOrderComponent(
	< Props extends Record< string, any > >(
		Wrapped: ComponentType< Props >
	) => {
		if ( Wrapped.prototype instanceof Component ) {
			return class extends Component< Props > {
				shouldComponentUpdate( nextProps: Props, nextState: Props ) {
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
				return <Wrapped { ...this.props } />;
			}
		};
	},
	'pure'
);

export default pure;
