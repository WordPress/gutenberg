/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/components';
import { createHigherOrderComponent, useInstanceId } from '@wordpress/compose';
import { addFilter, removeFilter } from '@wordpress/hooks';

const FilteredComponent = ( {
	filterName,
	as: Component,
	namespace,
	priority,
	...props
} ) => {
	const instanceId = useInstanceId( FilteredComponent );

	// Rules of React hooks require unusual handling of the default value.
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
		addFilter( filterName, namespace, callback, priority );

		return () => {
			removeFilter( filterName, namespace );
		};
	}, [ filterName ] );

	return null;
};

export default FilteredComponent;
