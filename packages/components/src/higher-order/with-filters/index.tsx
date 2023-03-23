/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { addAction, applyFilters, removeAction } from '@wordpress/hooks';
import { createHigherOrderComponent, debounce } from '@wordpress/compose';

const ANIMATION_FRAME_PERIOD = 16;

/**
 * Creates a higher-order component which adds filtering capability to the
 * wrapped component. Filters get applied when the original component is about
 * to be mounted. When a filter is added or removed that matches the hook name,
 * the wrapped component re-renders.
 *
 * @param hookName Hook name exposed to be used by filters.
 *
 * @return Higher-order component factory.
 *
 * ```jsx
 * import { withFilters } from '@wordpress/components';
 * import { addFilter } from '@wordpress/hooks';
 *
 * const MyComponent = ( { title } ) => <h1>{ title }</h1>;
 *
 * const ComponentToAppend = () => <div>Appended component</div>;
 *
 * function withComponentAppended( FilteredComponent ) {
 * 	return ( props ) => (
 * 		<>
 * 			<FilteredComponent { ...props } />
 * 			<ComponentToAppend />
 * 		</>
 * 	);
 * }
 *
 * addFilter(
 * 	'MyHookName',
 * 	'my-plugin/with-component-appended',
 * 	withComponentAppended
 * );
 *
 * const MyComponentWithFilters = withFilters( 'MyHookName' )( MyComponent );
 * ```
 */
export default function withFilters( hookName: string ) {
	return createHigherOrderComponent( ( OriginalComponent ) => {
		const namespace = 'core/with-filters/' + hookName;

		/**
		 * The component definition with current filters applied. Each instance
		 * reuse this shared reference as an optimization to avoid excessive
		 * calls to `applyFilters` when many instances exist.
		 */
		let FilteredComponent: React.ComponentType;

		/**
		 * Initializes the FilteredComponent variable once, if not already
		 * assigned. Subsequent calls are effectively a noop.
		 */
		function ensureFilteredComponent() {
			if ( FilteredComponent === undefined ) {
				FilteredComponent = applyFilters(
					hookName,
					OriginalComponent
				) as React.ComponentType;
			}
		}

		class FilteredComponentRenderer extends Component {
			static instances: FilteredComponentRenderer[];

			constructor( props: { [ key: string ]: any } ) {
				super( props );

				ensureFilteredComponent();
			}

			componentDidMount() {
				FilteredComponentRenderer.instances.push( this );

				// If there were previously no mounted instances for components
				// filtered on this hook, add the hook handler.
				if ( FilteredComponentRenderer.instances.length === 1 ) {
					addAction( 'hookRemoved', namespace, onHooksUpdated );
					addAction( 'hookAdded', namespace, onHooksUpdated );
				}
			}

			componentWillUnmount() {
				FilteredComponentRenderer.instances =
					FilteredComponentRenderer.instances.filter(
						( instance ) => instance !== this
					);

				// If this was the last of the mounted components filtered on
				// this hook, remove the hook handler.
				if ( FilteredComponentRenderer.instances.length === 0 ) {
					removeAction( 'hookRemoved', namespace );
					removeAction( 'hookAdded', namespace );
				}
			}

			render() {
				return <FilteredComponent { ...this.props } />;
			}
		}

		FilteredComponentRenderer.instances = [];

		/**
		 * Updates the FilteredComponent definition, forcing a render for each
		 * mounted instance. This occurs a maximum of once per animation frame.
		 */
		const throttledForceUpdate = debounce( () => {
			// Recreate the filtered component, only after delay so that it's
			// computed once, even if many filters added.
			FilteredComponent = applyFilters(
				hookName,
				OriginalComponent
			) as React.ComponentType;

			// Force each instance to render.
			FilteredComponentRenderer.instances.forEach( ( instance ) => {
				instance.forceUpdate();
			} );
		}, ANIMATION_FRAME_PERIOD );

		/**
		 * When a filter is added or removed for the matching hook name, each
		 * mounted instance should re-render with the new filters having been
		 * applied to the original component.
		 *
		 * @param updatedHookName Name of the hook that was updated.
		 */
		function onHooksUpdated( updatedHookName: string ) {
			if ( updatedHookName === hookName ) {
				throttledForceUpdate();
			}
		}

		return FilteredComponentRenderer;
	}, 'withFilters' );
}
