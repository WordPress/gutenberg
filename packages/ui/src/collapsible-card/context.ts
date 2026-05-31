import { createContext } from '@wordpress/element';

export const HeaderDescriptionIdContext = createContext< {
	setDescriptionId: ( id: string | undefined ) => void;
} >( {
	setDescriptionId: () => {},
} );
