/**
 * WordPress dependencies
 */
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
} from '@wordpress/element';

const RenderedRefsContext = createContext( [] );

export default function useNoRecursiveRenders( ref ) {
	const previouslyRenderedRefs = useContext( RenderedRefsContext );
	const hasAlreadyRendered = previouslyRenderedRefs.includes( ref );
	const newRenderedRefs = useMemo( () => [ ...previouslyRenderedRefs, ref ], [
		ref,
		previouslyRenderedRefs,
	] );
	const Provider = useCallback(
		( { children } ) => (
			<RenderedRefsContext.Provider value={ newRenderedRefs }>
				{ children }
			</RenderedRefsContext.Provider>
		),
		[ newRenderedRefs ]
	);
	return [ hasAlreadyRendered, Provider ];
}
