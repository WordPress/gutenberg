/**
 * External dependencies
 */
import { mapValues } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { RegistryConsumer } from '../registry-provider';

/**
 * Higher-order component used to add dispatch props using registered action creators.
 *
 * @param {Object} mapDispatchToProps Object of prop names where value is a
 *                                    dispatch-bound action creator, or a
 *                                    function to be called with the
 *                                    component's props and returning an
 *                                    action creator.
 *
 * @example
 * ```jsx
 * function Button( { onClick, children } ) {
 * 	return <button type="button" onClick={ onClick }>{ children }</button>;
 * }
 *
 * const { withDispatch } = wp.data;
 *
 * const SaleButton = withDispatch( ( dispatch, ownProps ) => {
 * 	const { startSale } = dispatch( 'my-shop' );
 * 	const { discountPercent } = ownProps;
 *
 * 	return {
 * 		onClick() {
 * 			startSale( discountPercent );
 * 		},
 * 	};
 * } )( Button );
 *
 * // Rendered in the application:
 * //
 * //  <SaleButton discountPercent="20">Start Sale!</SaleButton>
 * ```
 *
 * @example
 * In the majority of cases, it will be sufficient to use only two first params passed to `mapDispatchToProps` as illustrated in the previous example. However, there might be some very advanced use cases where using the `registry` object might be used as a tool to optimize the performance of your component. Using `select` function from the registry might be useful when you need to fetch some dynamic data from the store at the time when the event is fired, but at the same time, you never use it to render your component. In such scenario, you can avoid using the `withSelect` higher order component to compute such prop, which might lead to unnecessary re-renders of your component caused by its frequent value change. Keep in mind, that `mapDispatchToProps` must return an object with functions only.
 *
 * ```jsx
 * function Button( { onClick, children } ) {
 * 	return <button type="button" onClick={ onClick }>{ children }</button>;
 * }
 *
 * const { withDispatch } = wp.data;
 *
 * const SaleButton = withDispatch( ( dispatch, ownProps, { select } ) => {
 * 	// Stock number changes frequently.
 * 	const { getStockNumber } = select( 'my-shop' );
 * 	const { startSale } = dispatch( 'my-shop' );
 *
 * 	return {
 * 		onClick() {
 * 			const dicountPercent = getStockNumber() > 50 ? 10 : 20;
 * 			startSale( discountPercent );
 * 		},
 * 	};
 * } )( Button );
 *
 * // Rendered in the application:
 * //
 * //  <SaleButton>Start Sale!</SaleButton>
 * ```
 * _Note:_ It is important that the `mapDispatchToProps` function always returns an object with the same keys. For example, it should not contain conditions under which a different value would be returned.
 *
 * @return {Component} Enhanced component with merged dispatcher props.
 */
const withDispatch = ( mapDispatchToProps ) => createHigherOrderComponent(
	( WrappedComponent ) => {
		class ComponentWithDispatch extends Component {
			constructor( props ) {
				super( ...arguments );

				this.proxyProps = {};

				this.setProxyProps( props );
			}

			proxyDispatch( propName, ...args ) {
				// Original dispatcher is a pre-bound (dispatching) action creator.
				mapDispatchToProps( this.props.registry.dispatch, this.props.ownProps, this.props.registry )[ propName ]( ...args );
			}

			setProxyProps( props ) {
				// Assign as instance property so that in subsequent render
				// reconciliation, the prop values are referentially equal.
				// Importantly, note that while `mapDispatchToProps` is
				// called, it is done only to determine the keys for which
				// proxy functions should be created. The actual registry
				// dispatch does not occur until the function is called.
				const propsToDispatchers = mapDispatchToProps( this.props.registry.dispatch, props.ownProps, this.props.registry );
				this.proxyProps = mapValues( propsToDispatchers, ( dispatcher, propName ) => {
					if ( typeof dispatcher !== 'function' ) {
						// eslint-disable-next-line no-console
						console.warn( `Property ${ propName } returned from mapDispatchToProps in withDispatch must be a function.` );
					}
					// Prebind with prop name so we have reference to the original
					// dispatcher to invoke. Track between re-renders to avoid
					// creating new function references every render.
					if ( this.proxyProps.hasOwnProperty( propName ) ) {
						return this.proxyProps[ propName ];
					}

					return this.proxyDispatch.bind( this, propName );
				} );
			}

			render() {
				return <WrappedComponent { ...this.props.ownProps } { ...this.proxyProps } />;
			}
		}

		return ( ownProps ) => (
			<RegistryConsumer>
				{ ( registry ) => (
					<ComponentWithDispatch
						ownProps={ ownProps }
						registry={ registry }
					/>
				) }
			</RegistryConsumer>
		);
	},
	'withDispatch'
);

export default withDispatch;
