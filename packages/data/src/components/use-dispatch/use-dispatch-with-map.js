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
						`Property ${ propName } returned from mapDispatchToProps in withDispatch must be a function.`
					);
				}
				return dispatcher;
			}
		);
	}, [ registry, dispatchMap ] );
};

export default useDispatchWithMap;
