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
	return useMemo( () => registry.dispatch( storeName ), [ registry ] );
};

export default useDispatch;
