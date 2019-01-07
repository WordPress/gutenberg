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

		class FilteredComponent extends Component {
			constructor( props ) {
				super( props );

				this.Component = applyFilters( hookName, OriginalComponent );
				this.throttledForceUpdate = debounce( () => {
					this.Component = applyFilters( hookName, OriginalComponent );
					this.forceUpdate();
				}, ANIMATION_FRAME_PERIOD );
			}

			componentDidMount() {
				FilteredComponent.instances.push( this );

				// If there were previously no mounted instances for components
				// filtered on this hook, add the hook handler.
				if ( FilteredComponent.instances.length === 1 ) {
					addAction( 'hookRemoved', namespace, onHooksUpdated );
					addAction( 'hookAdded', namespace, onHooksUpdated );
				}
			}

			componentWillUnmount() {
				this.throttledForceUpdate.cancel();

				FilteredComponent.instances = without( FilteredComponent.instances, this );

				// If this was the last of the mounted components filtered on
				// this hook, remove the hook handler.
				if ( FilteredComponent.instances.length === 0 ) {
					removeAction( 'hookRemoved', namespace );
					removeAction( 'hookAdded', namespace );
				}
			}

			render() {
				return <this.Component { ...this.props } />;
			}
		}

		FilteredComponent.instances = [];

		/**
		 * When a filter is added or removed for the matching hook name, each
		 * mounted instance should re-render.
		 *
		 * @param {string} updatedHookName Name of the hook that was updated.
		 */
		function onHooksUpdated( updatedHookName ) {
			if ( updatedHookName === hookName ) {
				FilteredComponent.instances.forEach( ( instance ) => {
					instance.throttledForceUpdate();
				} );
			}
		}

		return FilteredComponent;
	}, 'withFilters' );
}
