import { Component } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';
import type { ComponentType } from 'react';
import { createHigherOrderComponent } from '../../utils/create-higher-order-component';
import type {
	WithInjectedProps,
	WithoutInjectedProps,
} from '../../utils/create-higher-order-component';
import type { WithStateHOC, WithStateInnerProps } from './types';

function createWithState< TState extends object >( initialState: TState ) {
	deprecated( 'wp.compose.withState', {
		since: '5.8',
		alternative: 'wp.element.useState',
	} );

	return createHigherOrderComponent(
		< C extends WithInjectedProps< C, WithStateInnerProps< TState > > >(
			OriginalComponent: C
		) => {
			type OwnProps = WithoutInjectedProps<
				C,
				WithStateInnerProps< TState >
			>;
			// A concrete type, since JSX cannot resolve the props of a generic `C`.
			const Inner: ComponentType<
				OwnProps & WithStateInnerProps< TState, OwnProps >
			> = OriginalComponent;
			return class WrappedComponent extends Component<
				OwnProps,
				TState
			> {
				constructor( props: OwnProps ) {
					super( props );

					this.setState = this.setState.bind( this );

					this.state = initialState;
				}

				render() {
					return (
						<Inner
							{ ...this.props }
							{ ...this.state }
							setState={ this.setState }
						/>
					);
				}
			};
		},
		'withState'
	) as WithStateHOC< TState >;
}

/**
 * A Higher Order Component used to provide and manage internal component state
 * via props.
 *
 * @deprecated Use `useState` instead.
 *
 * @param {Object} [initialState] Optional initial state of the component.
 *
 * @return A higher order component wrapper accepting a component that takes the state props + its own props + `setState` and returning a component that only accepts the own props.
 */
export default function withState< TState extends object >(
	initialState: TState
): WithStateHOC< TState >;
// Without an initial state, every state key must be optional.
export default function withState< TState extends object = object >(
	...args: {} extends TState ? [] : [ never ]
): WithStateHOC< TState >;
export default function withState( initialState: object = {} ) {
	return createWithState( initialState );
}
