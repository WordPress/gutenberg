/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	useViewportState,
	type UseViewportStateReturn,
} from '../hooks/use-viewport-state';

type ViewportContextValue = UseViewportStateReturn | null;

const ViewportContext = createContext< ViewportContextValue >( null );

export function ViewportProvider( {
	children,
}: {
	children: React.ReactNode;
} ) {
	const viewportState = useViewportState();
	return (
		<ViewportContext.Provider value={ viewportState }>
			{ children }
		</ViewportContext.Provider>
	);
}

/**
 * Returns the viewport context. Throws if used outside a ViewportProvider.
 */
export function useViewport(): UseViewportStateReturn {
	const context = useContext( ViewportContext );
	if ( ! context ) {
		throw new Error(
			'useViewport must be used within a ViewportProvider.'
		);
	}
	return context;
}

/**
 * Returns the viewport context, or null when used outside a ViewportProvider.
 * Use this in components that work with or without a viewport.
 */
export function useViewportOptional(): UseViewportStateReturn | null {
	return useContext( ViewportContext );
}
