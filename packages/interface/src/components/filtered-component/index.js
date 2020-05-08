/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { createHigherOrderComponent, useInstanceId } from '@wordpress/compose';
import { addFilter, removeFilter } from '@wordpress/hooks';

const FilteredComponent = ( {
	as: Component,
	hookName,
	namespace,
	priority,
	...props
} ) => {
	const instanceId = useInstanceId( FilteredComponent );

	// Rules of React hooks enforce unusual handling of the default value.
	namespace = namespace || instanceId;

	useEffect( () => {
		const callback = createHigherOrderComponent(
			( OriginalComponent ) => ( originalProps ) => {
				if ( typeof props.children === 'function' ) {
					return props.children( originalProps, OriginalComponent );
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

export default FilteredComponent;
