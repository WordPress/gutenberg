/**
 * WordPress dependencies
 */
import { pure, compose, createHigherOrderComponent } from '@wordpress/compose';

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
	compose( [
		pure,
		( WrappedComponent ) => {
			function ComponentWithDispatch( { registry, ownProps } ) {
				const mergeProps = mapDispatchToProps( registry.dispatch, ownProps );

				return <WrappedComponent { ...ownProps } { ...mergeProps } />;
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
	] ),
	'withDispatch'
);

export default withDispatch;
