/**
 * Internal dependencies
 */
import { useSelect } from '../use-select';

export default function useStoreSelectors( storeKey, _mapSelect, deps = [] ) {
	if ( Array.isArray( _mapSelect ) ) {
		// @TODO - check if all selectors exist and throw an error if not:
		// throw new Error( `Store ${ storeKey } is not registered` );

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
