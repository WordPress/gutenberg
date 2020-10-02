/**
 * External dependencies
 */
import type { ComponentClass, ComponentType } from 'react';

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
 * Given a component returns the enhanced component augmented with a component
 * only rerendering when its props/state change
 *
 * @param mapComponentToEnhancedComponent Function mapping component
 *                                        to enhanced component.
 * @param modifierName                    Seed name from which to
 *                                        generated display name.
 *
 * @return Component class with generated display name assigned.
 */
const pure = createHigherOrderComponent( makePure, 'pure' );

function makePure< P >( Wrapped: ComponentType< P > ): ComponentClass< P > {
	if ( Wrapped.prototype instanceof Component ) {
		return class extends ( Wrapped as ComponentClass< P > ) {
			shouldComponentUpdate( nextProps: P, nextState: any ) {
				return (
					! isShallowEqual( nextProps, this.props ) ||
					! isShallowEqual( nextState, this.state )
				);
			}
		};
	}

	return class extends Component< P > {
		shouldComponentUpdate( nextProps: P ) {
			return ! isShallowEqual( nextProps, this.props );
		}

		render() {
			return <Wrapped { ...this.props } />;
		}
	};
}

class C extends Component< { foo: string } > {
	render() {
		return null;
	}
}

export default pure;
