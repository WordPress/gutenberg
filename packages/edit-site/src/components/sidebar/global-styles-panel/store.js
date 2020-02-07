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

export function useGlobalStylesStore() {
	// TODO: Replace with data/actions from wp.data
	const [ fontSize, setFontSize ] = useState( 16 );
	const [ fontWeight, setFontWeight ] = useState( 400 );
	const [ headingFontWeight, setHeadingFontWeight ] = useState( 600 );
	const [ fontScale, setFontScale ] = useState( 1.2 );
	const [ lineHeight, setLineHeight ] = useState( 1.5 );
	const [ quoteFontSize, setQuoteFontSize ] = useState( 24 );

	const [ textColor, setTextColor ] = useState( '#000000' );
	const [ backgroundColor, setBackgroundColor ] = useState( '#ffffff' );
	const [ primaryColor, setPrimaryColor ] = useState( '#0000ff' );

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
	};

	useRenderedGlobalStyles( styles );

	return {
		fontSize,
		setFontSize,
		fontScale,
		setFontScale,
		lineHeight,
		setLineHeight,
		fontWeight,
		setFontWeight,
		textColor,
		setTextColor,
		backgroundColor,
		setBackgroundColor,
		primaryColor,
		setPrimaryColor,
		headingFontWeight,
		setHeadingFontWeight,
		quoteFontSize,
		setQuoteFontSize,
	};
}

/**
 * NOTE: Generators for extra computed values.
 */

function generateLineHeight( { lineHeight = 1.5 } ) {
	return {
		lineHeight,
		titleLineHeight: lineHeight * 0.8,
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
