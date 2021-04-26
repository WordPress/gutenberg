/**
 * WordPress dependencies
 */
import {
	useCallback,
	useContext,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import { BlockRefs } from '../../provider/block-refs-provider';

export function useBlockRefProvider( clientId ) {
	const { refs, callbacks } = useContext( BlockRefs );
	const ref = useRef();
	useLayoutEffect( () => {
		refs.set( clientId, ref );
		return () => {
			refs.delete( clientId );
		};
	}, [] );
	return useCallback( ( node ) => {
		ref.current = node;
		callbacks.forEach( ( id, callback ) => {
			if ( clientId === id ) {
				callback( node );
			}
		} );
	}, [] );
}

function useBlockRef( clientId ) {
	const { refs } = useContext( BlockRefs );
	const freshClientId = useRef();
	freshClientId.current = clientId;
	// Always return an object, even if no ref exists for a given client ID, so
	// that `current` works at a later point.
	return useMemo(
		() => ( {
			get current() {
				return refs.get( freshClientId.current )?.current || null;
			},
		} ),
		[]
	);
}

function useBlockElement( clientId ) {
	const { callbacks } = useContext( BlockRefs );
	const ref = useBlockRef( clientId );
	const [ element, setElement ] = useState( null );

	useLayoutEffect( () => {
		if ( ! clientId ) {
			return;
		}

		callbacks.set( setElement, clientId );
		return () => {
			callbacks.delete( setElement );
		};
	}, [ clientId ] );

	return ref.current || element;
}

export { useBlockRef as __unstableUseBlockRef };
export { useBlockElement as __unstableUseBlockElement };
