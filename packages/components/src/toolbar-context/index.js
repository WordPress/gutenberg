/**
 * External dependencies
 */
import { useToolbarState } from 'reakit';

/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

const ToolbarContext = createContext();

export function ToolbarProvider( { children } ) {
	// https://reakit.io/docs/basic-concepts/#state-hooks
	const state = useToolbarState( { loop: true } );
	return (
		<ToolbarContext.Provider value={ state }>
			{ children }
		</ToolbarContext.Provider>
	);
}

export default ToolbarContext;
