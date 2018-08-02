/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import isShallowEqual from '@wordpress/is-shallow-equal';
import { remountOnPropChange, createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { RegistryConsumer } from '../registry-provider';

/**
 * Higher-order component used to inject state-derived props using registered
 * selectors.
 *
 * @param {string} apiName Name of api from which resources are needed.
 * @param {Function} mapSelectorsToProps Function called on every state change,
 *                                       expected to return object of props to
 *                                       merge with the component's own props.
 * @param {Function} [mapMutationsToProps] Function called which maps resource
 *                                         mutations to event handle callbacks.
 * @return {Component} Enhanced component with merged state data props.
 */
const withResources = ( apiName, mapSelectorsToProps, mapMutationsToProps ) => createHigherOrderComponent( ( WrappedComponent ) => {
	/**
	 * Default merge props. A constant value is used as the fallback since it
	 * can be more efficiently shallow compared in case component is repeatedly
 	 * rendered without its own merge props.
	 *
	 * @type {Object}
	 */
	const DEFAULT_MERGE_PROPS = {};

	const ComponentWithSelectors = remountOnPropChange( 'registry' )( class extends Component {
		constructor( props ) {
			super( props );

			this.subscribe();

			this.mergeProps = this.getNextMergeProps( props );
		}

		/**
		 * Given a props object, returns the next merge props by mapStateToProps.
		 *
		 * @param {Object} props Props to pass as argument to mapStateToProps.
		 *
		 * @return {Object} Props to merge into rendered wrapped element.
		 */
		getNextMergeProps( props ) {
			const apiClient = props.registry.getApiClient( apiName );
			let selectorProps = DEFAULT_MERGE_PROPS;
			let mutationProps = {};

			apiClient.setComponentData( this, ( selectors ) => {
				selectorProps = mapSelectorsToProps( selectors, props.ownProps );
			} );

			if ( mapMutationsToProps ) {
				const mutations = apiClient.getMutations();
				mutationProps = mapMutationsToProps( mutations, this.props );
			}

			return {
				...selectorProps,
				...mutationProps,
			};
		}

		componentDidMount() {
			this.canRunSelection = true;
		}

		componentWillUnmount() {
			this.canRunSelection = false;
			this.unsubscribe();
		}

		shouldComponentUpdate( nextProps, nextState ) {
			const hasPropsChanged = ! isShallowEqual( this.props.ownProps, nextProps.ownProps );

			// Only render if props have changed or merge props have been updated
			// from the store subscriber.
			if ( this.state === nextState && ! hasPropsChanged ) {
				return false;
			}

			// If merge props change as a result of the incoming props, they
			// should be reflected as such in the upcoming render.
			if ( hasPropsChanged ) {
				const nextMergeProps = this.getNextMergeProps( nextProps );
				if ( ! isShallowEqual( this.mergeProps, nextMergeProps ) ) {
					// Side effects are typically discouraged in lifecycle methods, but
					// this component is heavily used and this is the most performant
					// code we've found thus far.
					// Prior efforts to use `getDerivedStateFromProps` have demonstrated
					// miserable performance.
					this.mergeProps = nextMergeProps;
				}
			}

			return true;
		}

		subscribe() {
			const apiClient = this.props.registry.getApiClient( apiName );
			this.unsubscribe = apiClient.subscribe( () => {
				if ( ! this.canRunSelection ) {
					return;
				}

				const nextMergeProps = this.getNextMergeProps( this.props );
				if ( isShallowEqual( this.mergeProps, nextMergeProps ) ) {
					return;
				}

				this.mergeProps = nextMergeProps;

				// Schedule an update. Merge props are not assigned to state
				// because derivation of merge props from incoming props occurs
				// within shouldComponentUpdate, where setState is not allowed.
				// setState is used here instead of forceUpdate because forceUpdate
				// bypasses shouldComponentUpdate altogether, which isn't desireable
				// if both state and props change within the same render.
				// Unfortunately this requires that next merge props are generated
				// twice.
				this.setState( {} );
			} );
		}

		render() {
			return <WrappedComponent { ...this.props.ownProps } { ...this.mergeProps } />;
		}
	} );

	return ( ownProps ) => (
		<RegistryConsumer>
			{ ( registry ) => (
				<ComponentWithSelectors
					ownProps={ ownProps }
					registry={ registry }
				/>
			) }
		</RegistryConsumer>
	);
}, 'withResources' );

export default withResources;
