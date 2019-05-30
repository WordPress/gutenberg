/**
 * Internal dependencies
 */
import useRegistry from '../registry-provider/use-registry';

const useDispatch = ( storeName ) => {
	const { dispatch } = useRegistry();
	return storeName === void 0 ? dispatch : dispatch( storeName );
};

export default useDispatch;
