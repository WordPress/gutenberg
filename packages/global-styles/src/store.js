/**
 * WordPress dependencies
 */
import { useState, useContext, createContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useRenderedGlobalStyles } from './renderer';

/**
 * TODO: Replace everything below with wp.data store mechanism
 */

export const GlobalStylesContext = createContext( {} );
export const useGlobalStylesState = () => useContext( GlobalStylesContext );

export function GlobalStylesStateProvider( { children } ) {
	const state = useGlobalStylesStore();

	return (
		<GlobalStylesContext.Provider value={ state }>
			{ children }
		</GlobalStylesContext.Provider>
	);
}

export function useGlobalStylesDataState() {
	const initialState = {
		fontSize: 16,
		fontWeight: 400,
		headingFontWeight: 600,
		fontScale: 1.2,
		lineHeight: 1.5,
		quoteFontSize: 24,
		textColor: '#000000',
		backgroundColor: '#ffffff',
		primaryColor: '#0000ff',
		paragraphColor: null,
		paragraphLineHeight: null,
	};

	const [ state, _setState ] = useState( initialState );

	const setState = ( nextState = {} ) => {
		const mergedState = { ...state, ...nextState };
		_setState( mergedState );
	};

	return [ state, setState ];
}

export function useGlobalStylesStore() {
	// TODO: Replace with data/actions from wp.data
	const [ styleState, setStyles ] = useGlobalStylesDataState();
	const {
		fontSize,
		fontScale,
		lineHeight,
		fontWeight,
		headingFontWeight,
		paragraphColor,
		paragraphLineHeight,
		quoteFontSize,
		textColor,
		backgroundColor,
		primaryColor,
	} = styleState;

	const styles = {
		color: {
			text: textColor,
			background: backgroundColor,
			primary: primaryColor,
		},
		typography: {
			...generateFontSizes( { fontSize, fontScale } ),
			...generateLineHeight( { lineHeight } ),
			fontScale,
			fontWeight,
		},
		heading: {
			fontWeight: headingFontWeight,
		},
		quote: {
			fontSize: toPx( quoteFontSize ),
		},
		paragraph: {
			color: paragraphColor,
			lineHeight: paragraphLineHeight,
		},
	};

	useRenderedGlobalStyles( styles );

	return {
		...styleState,
		setStyles,
	};
}

/**
 * NOTE: Generators for extra computed values.
 */

function generateLineHeight( { lineHeight = 1.5 } ) {
	return {
		lineHeight,
		titleLineHeight: ( lineHeight * 0.8 ).toFixed( 2 ),
	};
}

function generateFontSizes( { fontSize = 16, fontScale = 1.2 } ) {
	const toScaledPx = ( size ) => {
		const value = ( Math.pow( fontScale, size ) * fontSize ).toFixed( 2 );
		return toPx( value );
	};

	return {
		fontSize: `${ fontSize }px`,
		fontSizeH1: toScaledPx( 5 ),
		fontSizeH2: toScaledPx( 4 ),
		fontSizeH3: toScaledPx( 3 ),
		fontSizeH4: toScaledPx( 2 ),
		fontSizeH5: toScaledPx( 1 ),
		fontSizeH6: toScaledPx( 0.5 ),
	};
}

function toPx( value ) {
	return `${ value }px`;
}
