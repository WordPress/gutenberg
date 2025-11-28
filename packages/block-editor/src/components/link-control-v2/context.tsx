/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { LinkControlV2ContextValue } from './types';

export const LinkControlV2Context = createContext<
	LinkControlV2ContextValue | undefined
>( undefined );
LinkControlV2Context.displayName = 'LinkControlV2Context';

/**
 * Hook to access LinkControlV2 context.
 * Throws if used outside of LinkControlV2 component.
 */
export function useLinkControlV2Context(): LinkControlV2ContextValue {
	const context = useContext( LinkControlV2Context );
	if ( ! context ) {
		throw new Error(
			'useLinkControlV2Context must be used within a LinkControlV2 component'
		);
	}
	return context;
}

