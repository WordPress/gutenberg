/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

const ExperimentsContext = createContext( [] );

export const ExperimentsProvider = ExperimentsContext.Provider;

export function useExperiments() {
	return useContext( ExperimentsContext );
}
