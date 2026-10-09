import { Component } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';
import type { ComponentType } from 'react';
import { createHigherOrderComponent } from '../../utils/create-higher-order-component';
import type { WithStateHOC, WithStateInnerProps } from './types';

/**
 * A Higher Order Component used to provide and manage internal component state
 * via props.
 *
 * @deprecated Use `useState` instead.
 *
 * @param      initialState Optional initial state of the component.
 *
 * @return A higher order component wrapper accepting a component that takes the state props + its own props + `setState` and returning a component that only accepts the own props.
 */
export default function withState< TState extends object = object >(
	initialState: TState = {} as TState
) {
	deprecated( 'wp.compose.withState', {
		since: '5.8',
		alternative: 'wp.element.useState',
	} );

	type Inner = ComponentType< WithStateInnerProps< TState > >;

	return createHigherOrderComponent( ( OriginalComponent: Inner ) => {
		return class WrappedComponent extends Component< object, TState > {
			constructor( props: object ) {
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
	}, 'withState' ) as WithStateHOC< TState >;
}
