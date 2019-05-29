/**
 * External dependencies
 */
import { mapValues } from 'lodash';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useRegistry from '../registry-provider/use-registry';

const useDispatchWithMap = ( dispatchMap ) => {
	const registry = useRegistry();
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
				}
				return dispatcher;
			}
		);
	}, [ dispatchMap, registry ] );
};

export default useDispatchWithMap;
