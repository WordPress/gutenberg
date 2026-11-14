import { Component } from '@wordpress/element';
import { addAction, applyFilters, removeAction } from '@wordpress/hooks';
import { createHigherOrderComponent, debounce } from '@wordpress/compose';
import { v4 as uuid } from 'uuid';

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
		const namespace = `core/with-filters/${ hookName }/${ uuid() }`;

		/**
		 * The component definition with current filters applied. Each instance
		 * reuse this shared reference as an optimization to avoid excessive
		 * calls to `applyFilters` when many instances exist.
		 */
		let FilteredComponent: React.ComponentType | undefined;
		const overlaySupportListeners = new Set< () => void >();
		let isListening = false;
		let unsubscribeRenderer: ( () => void ) | undefined;

		function notifyOverlaySupportListeners() {
			// A listener can add or remove subscriptions while handling this update.
			[ ...overlaySupportListeners ].forEach( ( listener ) =>
				listener()
			);
		}

		function updateRendererSubscription() {
			unsubscribeRenderer?.();
			unsubscribeRenderer = undefined;
			if (
				! overlaySupportListeners.size ||
				! FilteredComponent ||
				! Object.hasOwn(
					FilteredComponent,
					'subscribeUiOverlaySupport'
				)
			) {
				return;
			}
			const subscribe = Reflect.get(
				FilteredComponent,
				'subscribeUiOverlaySupport'
			);
			if ( typeof subscribe === 'function' ) {
				const unsubscribe = subscribe.call(
					FilteredComponent,
					notifyOverlaySupportListeners
				);
				if ( typeof unsubscribe === 'function' ) {
					unsubscribeRenderer = unsubscribe;
				}
			}
		}

		function resolveFilteredComponent() {
			return applyFilters(
				hookName,
				OriginalComponent
			) as React.ComponentType;
		}

		function updateHookSubscription() {
			const shouldListen =
				FilteredComponentRenderer.instances.size > 0 ||
				overlaySupportListeners.size > 0;
			if ( shouldListen === isListening ) {
				return;
			}
			isListening = shouldListen;
			if ( shouldListen ) {
				addAction( 'hookRemoved', namespace, onHooksUpdated );
				addAction( 'hookAdded', namespace, onHooksUpdated );
			} else {
				removeAction( 'hookRemoved', namespace );
				removeAction( 'hookAdded', namespace );
				throttledForceUpdate.cancel();
				FilteredComponent = undefined;
			}
		}

		/**
		 * Initializes the FilteredComponent variable once, if not already
		 * assigned. Subsequent calls are effectively a noop.
		 */
		function ensureFilteredComponent() {
			if ( FilteredComponent === undefined ) {
				FilteredComponent = resolveFilteredComponent();
			}
			return FilteredComponent;
		}

		class FilteredComponentRenderer extends Component {
			static instances: Set< FilteredComponentRenderer >;

			/** Whether the selected renderer explicitly supports WordPress UI overlays. */
			static get supportsUiOverlays(): boolean {
				const component = isListening
					? ensureFilteredComponent()
					: resolveFilteredComponent();
				return (
					!! component &&
					Object.hasOwn( component, 'supportsUiOverlays' ) &&
					Reflect.get( component, 'supportsUiOverlays' ) === true
				);
			}

			/** Observe changes even while the filtered control is not mounted. */
			static subscribeUiOverlaySupport(
				listener: () => void
			): () => void {
				ensureFilteredComponent();
				const subscription = () => listener();
				const hadListeners = overlaySupportListeners.size > 0;
				overlaySupportListeners.add( subscription );
				updateHookSubscription();
				if ( ! hadListeners ) {
					updateRendererSubscription();
				}
				return () => {
					overlaySupportListeners.delete( subscription );
					if ( ! overlaySupportListeners.size ) {
						updateRendererSubscription();
					}
					updateHookSubscription();
				};
			}

			constructor( props: { [ key: string ]: any } ) {
				super( props );

				ensureFilteredComponent();
			}

			componentDidMount() {
				FilteredComponentRenderer.instances.add( this );

				updateHookSubscription();
			}

			componentWillUnmount() {
				FilteredComponentRenderer.instances.delete( this );

				updateHookSubscription();
			}

			render() {
				const Renderer = ensureFilteredComponent();
				return <Renderer { ...this.props } />;
			}
		}

		FilteredComponentRenderer.instances = new Set();

		/**
		 * Updates the FilteredComponent definition, forcing a render for each
		 * mounted instance. This occurs a maximum of once per animation frame.
		 */
		const throttledForceUpdate = debounce( () => {
			// Recreate the filtered component, only after delay so that it's
			// computed once, even if many filters added.
			FilteredComponent = resolveFilteredComponent();
			updateRendererSubscription();
			notifyOverlaySupportListeners();

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
