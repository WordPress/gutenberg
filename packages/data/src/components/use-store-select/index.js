/**
 * Internal dependencies
 */
import useSelect from '../use-select';

export default function useStoreSelect( storeKey, _mapSelect, deps = [] ) {
	if ( Array.isArray( _mapSelect ) ) {
		deps = deps.concat( _mapSelect );
		const requestedSelectors = _mapSelect;
		_mapSelect = ( selectors ) => {
			const retval = {};
			for ( const key of requestedSelectors ) {
				retval[ key ] = selectors[ key ]();
			}
			return retval;
		};
	}
	return useSelect( ( select ) => _mapSelect( select( storeKey ) ), deps );
}
