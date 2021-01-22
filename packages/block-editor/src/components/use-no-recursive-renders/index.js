/**
 * WordPress dependencies
 */
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
} from '@wordpress/element';

const RenderedRefsContext = createContext( new Set() );

// Immutably add to a Set
function add( set, element ) {
	const result = new Set( set );
	result.add( element );
	return result;
}

export default function useNoRecursiveRenders( uniqueId ) {
	const previouslyRenderedBlocks = useContext( RenderedRefsContext );
	const hasAlreadyRendered = previouslyRenderedBlocks.has( uniqueId );
	const newRenderedBlocks = useMemo(
		() => add( previouslyRenderedBlocks, uniqueId ),
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
