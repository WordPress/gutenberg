import { createContext, useContext, useMemo } from '@wordpress/element';
import type { BlockContextProviderProps } from './types';

const Context = createContext< Record< string, unknown > >( {} );
Context.displayName = 'BlockContext';

/**
 * Component which merges passed value with current consumed block context.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/block-context/README.md
 *
 * @param {BlockContextProviderProps} props
 */
export function BlockContextProvider( {
	value,
	children,
}: BlockContextProviderProps ) {
	const context = useContext( Context );
	const nextValue = useMemo(
		() => ( { ...context, ...value } ),
		[ context, value ]
	);

	return <Context.Provider value={ nextValue } children={ children } />;
}

export default Context;
