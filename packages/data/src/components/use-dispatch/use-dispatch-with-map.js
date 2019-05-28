/**
 * External dependencies
 */
import { mapValues } from 'lodash';

/**
 * WordPress dependencies
 */
import { useMemo, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useRegistry from '../registry-provider/use-registry';

const useDispatchWithMap = ( _dispatchMap, deps ) => {
	const registry = useRegistry();
	const dispatchMap = useCallback( _dispatchMap, deps );
	return useMemo( () => {
		const currentDispatchProps = dispatchMap( registry.dispatch, registry );
		return mapValues(
			currentDispatchProps,
			( dispatcher, propName ) => {
				if ( typeof dispatcher !== 'function' ) {
					// eslint-disable-next-line no-console
					console.warn(
						`Property ${ propName } returned from dispatchMap in useDispatchWithMap must be a function.`
					);
					// only functions should be the values of properties returned from
					// the map.
					return () => void 0;
				}
				return dispatcher;
			}
		);
	}, [ registry, dispatchMap ] );
};

export default useDispatchWithMap;
