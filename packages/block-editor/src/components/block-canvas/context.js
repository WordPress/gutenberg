/**
 * WordPress dependencies
 */
import { createContext, useContext, useState } from '@wordpress/element';

const BlockCanvasContext = createContext( {
	disableInteractions: false,
	setDisableInteractions: () => {},
} );

export const BlockCanvasContextProvider = ( { children } ) => {
	const [ disableInteractions, setDisableInteractions ] = useState( false );
	return (
		<BlockCanvasContext.Provider
			value={ { disableInteractions, setDisableInteractions } }
		>
			{ children }
		</BlockCanvasContext.Provider>
	);
};

export const useBlockCanvasContext = () => {
	const context = useContext( BlockCanvasContext );
	if ( context === undefined ) {
		throw new Error(
			'useBlockCanvasContext must be used within a BlockCanvasContextProvider'
		);
	}
	return context;
};
