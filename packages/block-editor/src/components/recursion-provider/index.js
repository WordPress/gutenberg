/**
 * WordPress dependencies
 */
import { createContext, useContext, useMemo } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';

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
 * @param {*}      uniqueId       Any value that acts as a unique identifier for a block instance.
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
 * A React context provider for use with the `useHasRecursion` hook to prevent recursive
 * renders.
 *
 * Wrap block content with this provider and provide the same `uniqueId` prop as used
 * with `useHasRecursion`.
 *
 * @param {Object}      props
 * @param {*}           props.uniqueId  Any value that acts as a unique identifier for a block instance.
 * @param {string}      props.blockName Optional block name.
 * @param {JSX.Element} props.children  React children.
 *
 * @return {JSX.Element} A React element.
 */
export function RecursionProvider( { children, uniqueId, blockName = '' } ) {
	const previouslyRenderedBlocks = useContext( RenderedRefsContext );
	const { name } = useBlockEditContext();

	blockName = blockName || name;

	const newRenderedBlocks = useMemo(
		() => addToBlockType( previouslyRenderedBlocks, blockName, uniqueId ),
		[ previouslyRenderedBlocks, blockName, uniqueId ]
	);

	return (
		<RenderedRefsContext.Provider value={ newRenderedBlocks }>
			{ children }
		</RenderedRefsContext.Provider>
	);
}

/**
 * A React hook for keeping track of blocks previously rendered up in the block
 * tree. Blocks susceptible to recursion can use this hook in their `Edit`
 * function to prevent said recursion.
 *
 * Use this with the `RecursionProvider` component, using the same `uniqueId` value
 * for both the hook and the provider.
 *
 * @param {*}      uniqueId  Any value that acts as a unique identifier for a block instance.
 * @param {string} blockName Optional block name.
 *
 * @return {boolean} A boolean describing whether the provided id has already been rendered.
 */
export function useHasRecursion( uniqueId, blockName = '' ) {
	const previouslyRenderedBlocks = useContext( RenderedRefsContext );
	const { name } = useBlockEditContext();
	blockName = blockName || name;
	return Boolean( previouslyRenderedBlocks[ blockName ]?.has( uniqueId ) );
}

export const DeprecatedExperimentalRecursionProvider = ( props ) => {
	deprecated( 'wp.blockEditor.__experimentalRecursionProvider', {
		since: '6.5',
		alternative: 'wp.blockEditor.RecursionProvider',
	} );
	return <RecursionProvider { ...props } />;
};

export const DeprecatedExperimentalUseHasRecursion = ( ...args ) => {
	deprecated( 'wp.blockEditor.__experimentalUseHasRecursion', {
		since: '6.5',
		alternative: 'wp.blockEditor.useHasRecursion',
	} );
	return useHasRecursion( ...args );
};
