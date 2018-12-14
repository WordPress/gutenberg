/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import isShallowEqual from '@wordpress/is-shallow-equal';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { RegistryConsumer } from '../registry-provider';

/**
 * Higher-order component used to inject state-derived props using registered
 * selectors.
 *
 * @param {Function} mapSelectToProps Function called on every state change,
 *                                   expected to return object of props to
 *                                   merge with the component's own props.
 *
 * @return {Component} Enhanced component with merged state data props.
 */
const withSelect = ( mapSelectToProps ) => createHigherOrderComponent( ( WrappedComponent ) => {
	/**
	 * Default merge props. A constant value is used as the fallback since it
	 * can be more efficiently shallow compared in case component is repeatedly
 	 * rendered without its own merge props.
	 *
	 * @type {Object}
	 */
	const DEFAULT_MERGE_PROPS = {};

	/**
	 * Given a props object, returns the next merge props by mapSelectToProps.
	 *
	 * @param {Function}       select   Selector getter function.
	 * @param {Object}         ownProps The incoming props to the component.
	 * @param {WPDataRegistry} registry Contextual data registry.
	 *
	 * @return {Object} Props to merge into rendered wrapped element.
	 */
	function getNextMergeProps( select, ownProps, registry ) {
		return (
			mapSelectToProps( select, ownProps, registry ) ||
			DEFAULT_MERGE_PROPS
		);
	}

	/**
	 * Given a select function, returns an enhanced function which returns the
	 * same result, but also observes the unique set of reducer keys with which
	 * the function has been called. The keys can be retrieved by calling the
	 * `getReducerKeys` function on the returned enhanced function.
	 *
	 * @param {Function} select Original select function.
	 *
	 * @return {Function} Enhanced select function.
	 */
	function createObservedSelect( select ) {
		const reducerKeys = {};

		function observedSelect( reducerKey ) {
			reducerKeys[ reducerKey ] = true;
			return select( reducerKey );
		}

		observedSelect.getReducerKeys = function() {
			return Object.keys( reducerKeys );
		};

		return observedSelect;
	}

	class ComponentWithSelect extends Component {
		constructor( props ) {
			super( props );

			this.onStoreChange = this.onStoreChange.bind( this );

			this.subscribe( props );
		}

		componentDidMount() {
			this.canRunSelection = true;

			// A state change may have occurred between the constructor and
			// mount of the component (e.g. during the wrapped component's own
			// constructor), in which case selection should be rerun.
			if ( this.hasQueuedSelection ) {
				this.hasQueuedSelection = false;
				this.onStoreChange();
			}
		}

		componentWillUnmount() {
			this.canRunSelection = false;
			this.unsubscribe();
		}

		shouldComponentUpdate( nextProps, nextState ) {
			// Cycle subscription if registry changes.
			const hasRegistryChanged = nextProps.registry !== this.props.registry;
			if ( hasRegistryChanged ) {
				this.unsubscribe();
				this.subscribe( nextProps );
			}

			// Treat a registry change as equivalent to `ownProps`, to reflect
			// `mergeProps` to rendered component if and only if updated.
			const hasPropsChanged = (
				hasRegistryChanged ||
				! isShallowEqual( this.props.ownProps, nextProps.ownProps )
			);

			// Only render if props have changed or merge props have been updated
			// from the store subscriber.
			if ( this.state === nextState && ! hasPropsChanged ) {
				return false;
			}

			if ( hasPropsChanged ) {
				const { registry, ownProps } = nextProps;
				const nextMergeProps = getNextMergeProps( registry.select, ownProps, registry );
				if ( ! isShallowEqual( this.mergeProps, nextMergeProps ) ) {
					// If merge props change as a result of the incoming props,
					// they should be reflected as such in the upcoming render.
					// While side effects are discouraged in lifecycle methods,
					// this component is used heavily, and prior efforts to use
					// `getDerivedStateFromProps` had demonstrated miserable
					// performance.
					this.mergeProps = nextMergeProps;
				}

				// Regardless whether merge props are changing, fall through to
				// incur the render since the component will need to receive
				// the changed `ownProps`.
			}

			return true;
		}

		onStoreChange() {
			if ( ! this.canRunSelection ) {
				this.hasQueuedSelection = true;
				return;
			}

			const { registry, ownProps } = this.props;
			const nextMergeProps = getNextMergeProps( registry.select, ownProps, registry );
			if ( isShallowEqual( this.mergeProps, nextMergeProps ) ) {
				return;
			}

			this.mergeProps = nextMergeProps;

			// Schedule an update. Merge props are not assigned to state since
			// derivation of merge props from incoming props occurs within
			// shouldComponentUpdate, where setState is not allowed. setState
			// is used here instead of forceUpdate because forceUpdate bypasses
			// shouldComponentUpdate altogether, which isn't desireable if both
			// state and props change within the same render. Unfortunately,
			// this requires that next merge props are generated twice.
			this.setState( {} );
		}

		subscribe( props ) {
			const { registry, ownProps } = props;

			const observedSelect = createObservedSelect( registry.select );

			this.mergeProps = getNextMergeProps( observedSelect, ownProps, registry );

			this.unsubscribe = registry.subscribe( this.onStoreChange, observedSelect.getReducerKeys() );
		}

		render() {
			return <WrappedComponent { ...this.props.ownProps } { ...this.mergeProps } />;
		}
	}

	return ( ownProps ) => (
		<RegistryConsumer>
			{ ( registry ) => (
				<ComponentWithSelect
					ownProps={ ownProps }
					registry={ registry }
				/>
			) }
		</RegistryConsumer>
	);
}, 'withSelect' );

export default withSelect;
