/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { createContext, useContext, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

/** @typedef {import('react').ReactNode} ReactNode */

/**
 * @typedef BlockContextProviderProps
 *
 * @property {Record<string,*>} value    Context value to merge with current
 *                                       value.
 * @property {ReactNode}        children Component children.
 */

/** @type {import('react').Context<Record<string,*>>} */
const Context = createContext( {} );

/**
 * Component which merges passed value with current consumed block context.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/block-context/README.md
 *
 * @param {BlockContextProviderProps} props
 */
export function BlockContextProvider( { value, children } ) {
	const context = useContext( Context );
	const nextValue = useMemo(
		() => ( { ...context, ...value } ),
		[ context, value ]
	);
	useDispatch( blockEditorStore ).updateBlockContext( nextValue );

	return <Context.Provider value={ nextValue } children={ children } />;
}

export default Context;
