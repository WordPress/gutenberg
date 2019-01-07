/**
 * External dependencies
 */
import { debounce, without } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { addAction, applyFilters, removeAction } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';

const ANIMATION_FRAME_PERIOD = 16;

/**
 * Creates a higher-order component which adds filtering capability to the
 * wrapped component. Filters get applied when the original component is about
 * to be mounted. When a filter is added or removed that matches the hook name,
 * the wrapped component re-renders.
 *
 * @param {string} hookName Hook name exposed to be used by filters.
 *
 * @return {Function} Higher-order component factory.
 */
export default function withFilters( hookName ) {
	return createHigherOrderComponent( ( OriginalComponent ) => {
		const namespace = 'core/with-filters-' + hookName;

		/**
		 * Since filtering is applied to the component, each filtered instance
		 * can reuse a shared reference to the definition. This optimizes to
		 * avoid excessive calls to `applyFilters` when many instances exist.
		 *
		 * @type {Component}
		 */
		let FilteredComponent = applyFilters( hookName, OriginalComponent );

		class FilteredComponentRenderer extends Component {
			constructor( props ) {
				super( props );

				this.throttledForceUpdate = debounce(
					() => this.forceUpdate(),
					ANIMATION_FRAME_PERIOD
				);
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
				this.throttledForceUpdate.cancel();

				FilteredComponentRenderer.instances = without(
					FilteredComponentRenderer.instances,
					this
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
		 * When a filter is added or removed for the matching hook name, each
		 * mounted instance should re-render with the new filters having been
		 * applied to the original component.
		 *
		 * @param {string} updatedHookName Name of the hook that was updated.
		 */
		function onHooksUpdated( updatedHookName ) {
			if ( updatedHookName !== hookName ) {
				return;
			}

			// Recreate the filtered component.
			FilteredComponent = applyFilters( hookName, OriginalComponent );

			// Force each instance to render.
			FilteredComponentRenderer.instances.forEach( ( instance ) => {
				instance.throttledForceUpdate();
			} );
		}

		return FilteredComponentRenderer;
	}, 'withFilters' );
}
