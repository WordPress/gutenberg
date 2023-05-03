/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

const DisableBlockEditingContext = createContext( false );

export function DisableBlockEditing( { isDisabled = true, children } ) {
	return (
		<DisableBlockEditingContext.Provider value={ isDisabled }>
			{ children }
		</DisableBlockEditingContext.Provider>
	);
}

export function useIsBlockEditingDisabled() {
	return useContext( DisableBlockEditingContext );
}
