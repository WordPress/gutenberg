/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useRegistry from '../registry-provider/use-registry';

const useDispatch = ( storeName ) => {
	const registry = useRegistry();
	return useMemo( () => {
		return storeName === void 0 ?
			registry.dispatch :
			registry.dispatch( storeName );
	}, [ registry, storeName ] );
};

export default useDispatch;
