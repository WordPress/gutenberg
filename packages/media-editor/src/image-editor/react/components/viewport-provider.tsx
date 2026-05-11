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

type ViewportContextValue = UseViewportStateReturn;

const ViewportContext = createContext< ViewportContextValue | null >( null );

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

export function useViewport(): UseViewportStateReturn {
	const context = useContext( ViewportContext );
	if ( ! context ) {
		throw new Error(
			'useViewport must be used within a ViewportProvider.'
		);
	}
	return context;
}
