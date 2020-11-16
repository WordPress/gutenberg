/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { createHigherOrderComponent, useInstanceId } from '@wordpress/compose';
import { addFilter, removeFilter } from '@wordpress/hooks';

/**
 * Factory method that creates a new variation of `FilteredComponent` component,
 * with a provided hook name set, to be used with Plugins API.
 *
 * @example
 * ```js
 * import { createFilteredComponent } from '@wordpress/plugins';
 *
 * const FilteredMediaUpload = createFilteredComponent( 'editor.MediaUpload' );
 * ```
 *
 * @param {string} name The name of the existing hook.
 *
 * @return {WPComponent} Filtered component to use with Plugins API.
 */
export const createFilteredComponent = ( name ) =>
	function FilteredComponent( {
		as: Component,
		hookName = name,
		namespace,
		priority,
		...props
	} ) {
		const instanceId = useInstanceId( FilteredComponent );

		// Rules of React hooks enforce unusual handling of the default value.
		namespace = namespace || instanceId;

		useEffect( () => {
			const callback = createHigherOrderComponent(
				( OriginalComponent ) => ( originalProps ) => {
					if ( typeof props.children === 'function' ) {
						return props.children(
							originalProps,
							OriginalComponent
						);
					}
					return <Component { ...originalProps } { ...props } />;
				}
			);
			addFilter( hookName, namespace, callback, priority );

			return () => {
				removeFilter( hookName, namespace );
			};
		}, [ Component, hookName, namespace, priority ] );

		return null;
	};

/**
 * A component wrapper that makes it possible to integrate WordPress hooks API
 * applied to components with Plugins API.
 *
 * @example
 * ```js
 * import { FilteredComponent, registerPlugin } from '@wordpress/plugins';
 *
 * registerPlugin( 'my-plugin', {
 *     render() {
 *         return (
 *             <FilteredComponent
 *                 hookName="editor.MediaUpload"
 *                 namespace="core/edit-post/replace-media-upload"
 *                 as={ MediaUpload }
 *             />
 *         );
 *     },
 * } );
 * ```
 */
const FilteredComponent = createFilteredComponent();

export default FilteredComponent;
