/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type {
	WithInjectedProps,
	WithoutInjectedProps,
} from '../../utils/create-higher-order-component';
import { createHigherOrderComponent } from '../../utils/create-higher-order-component';

/**
 * We cannot use the `Window['setTimeout']` and `Window['clearTimeout']`
 * types here because those functions include functionality that is not handled
 * by this component, like the ability to pass extra arguments.
 *
 * In the case of this component, we only handle the simplest case where
 * `setTimeout` only accepts a function (not a string) and an optional delay.
 */
interface TimeoutProps {
	setTimeout: ( fn: () => void, delay: number ) => number;
	clearTimeout: ( id: number ) => void;
}

/**
 * A higher-order component used to provide and manage delayed function calls
 * that ought to be bound to a component's lifecycle.
 */
const withSafeTimeout = createHigherOrderComponent(
	< C extends WithInjectedProps< C, TimeoutProps > >(
		OriginalComponent: C
	) => {
		type WrappedProps = WithoutInjectedProps< C, TimeoutProps >;
		return class WrappedComponent extends Component< WrappedProps > {
			timeouts: number[];

			constructor( props: WrappedProps ) {
				super( props );
				this.timeouts = [];
				this.setTimeout = this.setTimeout.bind( this );
				this.clearTimeout = this.clearTimeout.bind( this );
			}

			componentWillUnmount() {
				this.timeouts.forEach( clearTimeout );
			}

			setTimeout( fn: () => void, delay: number ) {
				const id = setTimeout( () => {
					fn();
					this.clearTimeout( id );
				}, delay );
				this.timeouts.push( id );
				return id;
			}

			clearTimeout( id: number ) {
				clearTimeout( id );
				this.timeouts = this.timeouts.filter(
					( timeoutId ) => timeoutId !== id
				);
			}

			render() {
				return (
					// @ts-ignore
					<OriginalComponent
						{ ...this.props }
						setTimeout={ this.setTimeout }
						clearTimeout={ this.clearTimeout }
					/>
				);
			}
		};
	},
	'withSafeTimeout'
);

export default withSafeTimeout;
