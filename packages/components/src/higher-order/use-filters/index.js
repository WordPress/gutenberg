/**
 * WordPress dependencies
 */
import { useEffect, useCallback, useState } from '@wordpress/element';
import { addAction, applyFilters, removeAction } from '@wordpress/hooks';

const useFilters = ( hookName, originalValue, ...args ) => {
	const namespace = 'core/use-filter/' + hookName;

	const [ filteredValue, setFilteredValue ] = useState(
		applyFilters( hookName, originalValue, ...args )
	);

	const forceUpdate = useCallback( () => {
		setFilteredValue( applyFilters( hookName, originalValue, ...args ) );
	}, [ filteredValue, setFilteredValue, hookName, originalValue, args ] );

	const onHooksUpdated = useCallback(
		( updatedHookName ) => {
			if ( updatedHookName === hookName ) {
				forceUpdate();
			}
		},
		[ hookName, forceUpdate ]
	);

	useEffect( () => {
		addAction( 'hookRemoved', namespace, onHooksUpdated );
		addAction( 'hookAdded', namespace, onHooksUpdated );

		return () => {
			removeAction( 'hookRemoved', namespace );
			removeAction( 'hookAdded', namespace );
		};
	}, [ filteredValue, onHooksUpdated, namespace ] );

	return filteredValue;
};

export default useFilters;
