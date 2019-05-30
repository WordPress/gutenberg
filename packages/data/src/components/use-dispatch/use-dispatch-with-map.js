/**
 * External dependencies
 */
import { mapValues } from 'lodash';

/**
 * WordPress dependencies
 */
import { useMemo, useRef, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useRegistry from '../registry-provider/use-registry';

const useDispatchWithMap = ( dispatchMap ) => {
	const registry = useRegistry();
	const currentDispatchMap = useRef( dispatchMap );

	useEffect( () => {
		currentDispatchMap.current = dispatchMap;
	} );

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
				return ( ...args ) => {
					return currentDispatchMap.current( registry.dispatch, registry )[ propName ]( ...args );
				};
			}
		);
	}, [ dispatchMap, registry ] );
};

export default useDispatchWithMap;
