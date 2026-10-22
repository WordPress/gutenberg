import { createContext, useContext, useMemo } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';
import { useBlockEditContext } from '../block-edit/context';
import type { RecursionProviderProps, RenderedBlocks } from './types';

const RenderedRefsContext = createContext< RenderedBlocks >( {} );
RenderedRefsContext.displayName = 'RenderedRefsContext';

/**
 * Immutably adds an unique identifier to a set scoped for a given block type.
 *
 * @param renderedBlocks Rendered blocks grouped by block name
 * @param blockName      Name of the block.
 * @param uniqueId       Any value that acts as a unique identifier for a block instance.
 *
 * @return The list of rendered blocks grouped by block name.
 */
function addToBlockType(
	renderedBlocks: RenderedBlocks,
	blockName: string,
	uniqueId: unknown
): RenderedBlocks {
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
 * @param {Object}            props
 * @param {*}                 props.uniqueId  Any value that acts as a unique identifier for a block instance.
 * @param {string}            props.blockName Optional block name.
 * @param {React.JSX.Element} props.children  React children.
 *
 * @return {React.JSX.Element} A React element.
 */
export function RecursionProvider( {
	children,
	uniqueId,
	blockName = '',
}: RecursionProviderProps ) {
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
export function useHasRecursion(
	uniqueId: unknown,
	blockName: string = ''
): boolean {
	const previouslyRenderedBlocks = useContext( RenderedRefsContext );
	const { name } = useBlockEditContext();
	blockName = blockName || name;
	return Boolean( previouslyRenderedBlocks[ blockName ]?.has( uniqueId ) );
}

export const DeprecatedExperimentalRecursionProvider = (
	props: RecursionProviderProps
) => {
	deprecated( 'wp.blockEditor.__experimentalRecursionProvider', {
		since: '6.5',
		alternative: 'wp.blockEditor.RecursionProvider',
	} );
	return <RecursionProvider { ...props } />;
};

export const DeprecatedExperimentalUseHasRecursion = (
	...args: Parameters< typeof useHasRecursion >
) => {
	deprecated( 'wp.blockEditor.__experimentalUseHasRecursion', {
		since: '6.5',
		alternative: 'wp.blockEditor.useHasRecursion',
	} );
	return useHasRecursion( ...args );
};
