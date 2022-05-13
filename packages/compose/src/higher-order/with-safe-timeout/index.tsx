/**
 * External dependencies
 */
import { without } from 'lodash';
import type { ComponentProps, ComponentType } from 'react';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { createHigherOrderComponent } from '../../utils/create-higher-order-component';

/**
 * We cannot use the `Window['setTimeout']` and `Window['clearTimeout']`
 * types here because those functions include functionality that is not handled
 * by this component, like the ability to pass extra arguments.
 *
 * In the case of this component, we only handle the simplest case where
 * `setTimeout` only accepts a function (not a string) and an optional delay.
 */
interface TimeoutProps extends ComponentProps< any > {
	setTimeout: ( fn: () => void, delay: number ) => number;
	clearTimeout: ( id: number ) => void;
}

/**
 * A higher-order component used to provide and manage delayed function calls
 * that ought to be bound to a component's lifecycle.
 */
const withSafeTimeout = createHigherOrderComponent(
	<
		Props extends Partial< TimeoutProps >,
		OProps extends Omit< Props, 'setTimeout' | 'clearTimeout' >
	>(
		OriginalComponent: ComponentType< Props >
	): ComponentType< OProps > => {
		return class WrappedComponent extends Component< OProps > {
			timeouts: number[];

			constructor( props: OProps ) {
				super( props );
				this.timeouts = [];
				this.setTimeout = this.setTimeout.bind( this );
				this.clearTimeout = this.clearTimeout.bind( this );
			}

			componentWillUnmount() {
				this.timeouts.forEach( clearTimeout );
			}

			setTimeout( fn: ( ...args: any[] ) => void, delay: number ) {
				const id = setTimeout( () => {
					fn();
					this.clearTimeout( id );
				}, delay );
				this.timeouts.push( id );
				return id;
			}

			clearTimeout( id: number ) {
				clearTimeout( id );
				this.timeouts = without( this.timeouts, id );
			}

			render() {
				return (
					// @ts-expect-error
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
