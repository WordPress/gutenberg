/**
 * WordPress dependencies
 */
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useBlockEditContext } from '../block-edit/context';

const RenderedRefsContext = createContext( {} );

/**
 * Immutably adds an unique identifier to a set scoped for a given block type.
 *
 * @param {Object} renderedBlocks Rendered blocks grouped by block name
 * @param {string} blockName      Name of the block.
 * @param {*} uniqueId            Any value that acts as a unique identifier for a block instance.
 *
 * @return {Object} The list of rendered blocks grouped by block name.
 */
function addToBlockType( renderedBlocks, blockName, uniqueId ) {
	const result = {
		...renderedBlocks,
		[ blockName ]: renderedBlocks[ blockName ]
			? new Set( renderedBlocks[ blockName ] )
			: new Set(),
	};
	result[ blockName ].add( uniqueId );

	return result;
}

/**
 * A React hook for keeping track of blocks previously rendered up in the block
 * tree. Blocks susceptible to recursion can use this hook in their `Edit`
 * function to prevent said recursion.
 *
 * @param {*}      uniqueId  Any value that acts as a unique identifier for a block instance.
 * @param {string} blockName Optional block name.
 *
 * @return {[boolean, Function]} A tuple of:
 *                               - a boolean describing whether the provided id
 *                                 has already been rendered;
 *                               - a React context provider to be used to wrap
 *                                 other elements.
 */
export default function useNoRecursiveRenders( uniqueId, blockName = '' ) {
	const previouslyRenderedBlocks = useContext( RenderedRefsContext );
	const { name } = useBlockEditContext();
	blockName = blockName || name;
	const hasAlreadyRendered = Boolean(
		previouslyRenderedBlocks[ blockName ]?.has( uniqueId )
	);
	const newRenderedBlocks = useMemo(
		() => addToBlockType( previouslyRenderedBlocks, blockName, uniqueId ),
		[ previouslyRenderedBlocks, blockName, uniqueId ]
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
