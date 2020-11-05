/**
 * Internal dependencies
 */
import { useDispatch } from '../use-dispatch';

export default function createUseStoreDispatch( store ) {
	return function storeSpecificDispatch() {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		return useDispatch( store );
	};
}
