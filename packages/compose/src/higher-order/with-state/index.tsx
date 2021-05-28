/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { ComponentType } from 'react';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import createHigherOrderComponent from '../../utils/create-higher-order-component';
// eslint-disable-next-line no-duplicate-imports
import type { HigherOrderComponent } from '../../utils/create-higher-order-component';

/**
 * A Higher Order Component used to provide and manage internal component state
 * via props.
 * 
 * @deprecated Use `useState` instead.
 *
 * @param initialState Optional initial state of the component.
 *
 * @return A higher order component wrapper accepting a component that takes the state props + its own props + `setState` and returning a component that only accepts the own props.
 */
export default function withState<
	TProps extends object,
	TStateProps extends object
>(
	initialState: TStateProps = {} as TStateProps
): HigherOrderComponent<
	TProps &
		TStateProps & {
			setState: Component< TProps, TStateProps >[ 'setState' ];
		},
	TProps
> {
	deprecated( 'wp.compose.withState', {
		alternative: 'wp.element.useState',
	} );
	return createHigherOrderComponent(
		(
			OriginalComponent: ComponentType<
				TProps &
					TStateProps & {
						setState: Component<
							TProps,
							TStateProps
						>[ 'setState' ];
					}
			>
		) => {
			return class WrappedComponent extends Component<
				TProps,
				TStateProps
			> {
				constructor( props: any ) {
					super( props );

					this.setState = this.setState.bind( this );

					this.state = initialState;
				}

				render() {
					return (
						<OriginalComponent
							{ ...( this.props as TProps ) }
							{ ...( this.state as TStateProps ) }
							setState={ this.setState }
						/>
					);
				}
			};
		},
		'withState'
	);
}
