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

/**
 * A React hook for keeping track of blocks previously rendered up in the block
 * tree. Blocks susceptible to recursiion can use this hook in their `Edit`
 * function to prevent said recursion.
 *
 * @param {*} uniqueId Any value that acts as a unique identifier for a block instance.
 *
 * @return {[boolean, Function]} A tuple of:
 *                               - a boolean describing whether the provided id
 *                                 has already been rendered;
 *                               - a React context provider to be used to wrap
 *                                 other elements.
 */
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
