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
 * Higher-order component used to add dispatch props using registered action
 * creators.
 *
 * @param {Object} mapDispatchToProps Object of prop names where value is a
 *                                    dispatch-bound action creator, or a
 *                                    function to be called with with the
 *                                    component's props and returning an
 *                                    action creator.
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
