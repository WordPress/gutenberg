/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { isShallowEqualObjects } from '@wordpress/is-shallow-equal';
import { createHigherOrderComponent } from '@wordpress/compose';
import { createQueue } from '@wordpress/priority-queue';

/**
 * Internal dependencies
 */
import { RegistryConsumer } from '../registry-provider';
import { AsyncModeConsumer } from '../async-mode-provider';

const renderQueue = createQueue();

/**
 * Higher-order component used to inject state-derived props using registered
 * selectors.
 *
 * @param {Function} mapSelectToProps Function called on every state change,
 *                                   expected to return object of props to
 *                                   merge with the component's own props.
 *
 * @example
 * ```js
 * function PriceDisplay( { price, currency } ) {
 * 	return new Intl.NumberFormat( 'en-US', {
 * 		style: 'currency',
 * 		currency,
 * 	} ).format( price );
 * }
 *
 * const { withSelect } = wp.data;
 *
 * const HammerPriceDisplay = withSelect( ( select, ownProps ) => {
 * 	const { getPrice } = select( 'my-shop' );
 * 	const { currency } = ownProps;
 *
 * 	return {
 * 		price: getPrice( 'hammer', currency ),
 * 	};
 * } )( PriceDisplay );
 *
 * // Rendered in the application:
 * //
 * //  <HammerPriceDisplay currency="USD" />
 * ```
 * In the above example, when `HammerPriceDisplay` is rendered into an application, it will pass the price into the underlying `PriceDisplay` component and update automatically if the price of a hammer ever changes in the store.
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
	 * @param {Object} props Props to pass as argument to mapSelectToProps.
	 *
	 * @return {Object} Props to merge into rendered wrapped element.
	 */
	function getNextMergeProps( props ) {
		return (
			mapSelectToProps( props.registry.select, props.ownProps, props.registry ) ||
			DEFAULT_MERGE_PROPS
		);
	}

	class ComponentWithSelect extends Component {
		constructor( props ) {
			super( props );

			this.onStoreChange = this.onStoreChange.bind( this );

			this.subscribe( props.registry );

			this.mergeProps = getNextMergeProps( props );
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
			renderQueue.flush( this );
		}

		shouldComponentUpdate( nextProps, nextState ) {
			// Cycle subscription if registry changes.
			const hasRegistryChanged = nextProps.registry !== this.props.registry;
			const hasSyncRenderingChanged = nextProps.isAsync !== this.props.isAsync;

			if ( hasRegistryChanged ) {
				this.unsubscribe();
				this.subscribe( nextProps.registry );
			}

			if ( hasSyncRenderingChanged ) {
				renderQueue.flush( this );
			}

			// Treat a registry change as equivalent to `ownProps`, to reflect
			// `mergeProps` to rendered component if and only if updated.
			const hasPropsChanged = (
				hasRegistryChanged ||
				! isShallowEqualObjects( this.props.ownProps, nextProps.ownProps )
			);

			// Only render if props have changed or merge props have been updated
			// from the store subscriber.
			if ( this.state === nextState && ! hasPropsChanged && ! hasSyncRenderingChanged ) {
				return false;
			}

			if ( hasPropsChanged || hasSyncRenderingChanged ) {
				const nextMergeProps = getNextMergeProps( nextProps );
				if ( ! isShallowEqualObjects( this.mergeProps, nextMergeProps ) ) {
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

			const nextMergeProps = getNextMergeProps( this.props );
			if ( isShallowEqualObjects( this.mergeProps, nextMergeProps ) ) {
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

		subscribe( registry ) {
			this.unsubscribe = registry.subscribe( () => {
				if ( this.props.isAsync ) {
					renderQueue.add( this, this.onStoreChange );
				} else {
					this.onStoreChange();
				}
			} );
		}

		render() {
			return <WrappedComponent { ...this.props.ownProps } { ...this.mergeProps } />;
		}
	}

	return ( ownProps ) => (
		<AsyncModeConsumer>
			{ ( isAsync ) => (
				<RegistryConsumer>
					{ ( registry ) => (
						<ComponentWithSelect
							ownProps={ ownProps }
							registry={ registry }
							isAsync={ isAsync }
						/>
					) }
				</RegistryConsumer>
			) }
		</AsyncModeConsumer>
	);
}, 'withSelect' );

export default withSelect;
