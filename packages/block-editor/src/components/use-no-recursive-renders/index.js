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

export default function useNoRecursiveRenders( uniqueId ) {
	const previouslyRenderedBlocks = useContext( RenderedRefsContext );
	const hasAlreadyRendered = previouslyRenderedBlocks.includes( uniqueId );
	const newRenderedBlocks = useMemo(
		() => [ ...previouslyRenderedBlocks, uniqueId ],
		[ uniqueId, previouslyRenderedBlocks ]
	);
	const Provider = useCallback(
		( { children } ) => (
			<RenderedRefsContext.Provider value={ newRenderedBlocks }>
				{ children }
			</RenderedRefsContext.Provider>
		),
		[ newRenderedBlocks ]
	);
	return [ hasAlreadyRendered, Provider ];
}
