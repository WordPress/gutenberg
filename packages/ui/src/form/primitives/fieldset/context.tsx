import { createContext, useContext } from '@wordpress/element';

type FieldsetContextType = {
	registerDescriptionId: ( id: string ) => void;
	unregisterDescriptionId: () => void;
};

export const FieldsetContext = createContext< FieldsetContextType >( {
	registerDescriptionId: () => {},
	unregisterDescriptionId: () => {},
} );

export const useFieldsetContext = () => useContext( FieldsetContext );
