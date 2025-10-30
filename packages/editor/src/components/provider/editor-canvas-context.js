/**
 * WordPress dependencies
 */
import { createContext, useContext, useState } from '@wordpress/element';

const EditorCanvasContext = createContext( {
	canvasMinHeight: null,
	setCanvasMinHeight: () => {},
} );

export function EditorCanvasProvider( { children } ) {
	const [ canvasMinHeight, setCanvasMinHeight ] = useState( null );

	const value = {
		canvasMinHeight,
		setCanvasMinHeight,
	};

	return (
		<EditorCanvasContext.Provider value={ value }>
			{ children }
		</EditorCanvasContext.Provider>
	);
}

export function useEditorCanvas() {
	return useContext( EditorCanvasContext );
}
