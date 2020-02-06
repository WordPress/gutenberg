/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useLayoutEffect } from '@wordpress/element';

import {
	ColorControl,
	Panel,
	PanelBody,
	RangeControl,
} from '@wordpress/components';

export default function GlobalStylesPanel() {
	const {
		fontSize,
		setFontSize,
		fontScale,
		setFontScale,
		lineHeight,
		setLineHeight,
		textColor,
		setTextColor,
		backgroundColor,
		setBackgroundColor,
		primaryColor,
		setPrimaryColor,
	} = useGlobalStylesState();

	return (
		<Panel header={ __( 'Global Styles' ) }>
			<PanelBody title={ __( 'Typography' ) } initialOpen={ false }>
				<RangeControl
					label={ __( 'Font Size' ) }
					value={ fontSize }
					min={ 10 }
					max={ 30 }
					step={ 1 }
					onChange={ setFontSize }
				/>
				<RangeControl
					label={ __( 'Font Scale' ) }
					value={ fontScale }
					min={ 1.1 }
					max={ 1.4 }
					step={ 0.025 }
					onChange={ setFontScale }
				/>
				<RangeControl
					label={ __( 'Line Height' ) }
					value={ lineHeight }
					min={ 1 }
					max={ 2 }
					step={ 0.1 }
					onChange={ setLineHeight }
				/>
			</PanelBody>
			<PanelBody title={ __( 'Colors' ) } initialOpen={ false }>
				<ColorControl
					label={ __( 'Text' ) }
					value={ textColor }
					onChange={ setTextColor }
				/>
				<ColorControl
					label={ __( 'Background' ) }
					value={ backgroundColor }
					onChange={ setBackgroundColor }
				/>
				<ColorControl
					label={ __( 'Primary' ) }
					value={ primaryColor }
					onChange={ setPrimaryColor }
				/>
			</PanelBody>
		</Panel>
	);
}

function useGlobalStylesState() {
	// TODO: Replace with data/actions from wp.data
	const [ fontSize, setFontSize ] = useState( 16 );
	const [ fontScale, setFontScale ] = useState( 1.2 );
	const [ lineHeight, setLineHeight ] = useState( 1.5 );

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
		textColor,
		setTextColor,
		backgroundColor,
		setBackgroundColor,
		primaryColor,
		setPrimaryColor,
	};
}

function useGlobalStylesEnvironment() {
	useLayoutEffect( () => {
		// Adding a slight async delay to give the Gutenberg editor time to render.
		window.requestAnimationFrame( () => {
			// Getting the Gutenberg editor content wrapper DOM node.
			const editorNode = document.getElementsByClassName(
				'editor-styles-wrapper'
			)[ 0 ];

			const targetNode = editorNode || document.documentElement;

			if ( ! targetNode.classList.contains( 'wp-gs' ) ) {
				targetNode.classList.add( 'wp-gs' );
			}
		} );
	}, [] );
}

/**
 * TODO: Replace everything below with client-side style rendering mechanism
 */
function useRenderedGlobalStyles( styles = {} ) {
	useGlobalStylesEnvironment();
	const generatedStyles = compileStyles( styles );

	useEffect( () => {
		const styleNodeId = 'wp-global-styles-tag';
		let styleNode = document.getElementById( styleNodeId );

		if ( ! styleNode ) {
			styleNode = document.createElement( 'style' );
			styleNode.id = styleNodeId;
			document
				.getElementsByTagName( 'head' )[ 0 ]
				.appendChild( styleNode );
		}

		styleNode.innerText = generatedStyles;
	}, [ generatedStyles ] );
}

function flattenObject( ob ) {
	const toReturn = {};

	for ( const i in ob ) {
		if ( ! ob.hasOwnProperty( i ) ) continue;

		if ( typeof ob[ i ] === 'object' ) {
			const flatObject = flattenObject( ob[ i ] );
			for ( const x in flatObject ) {
				if ( ! flatObject.hasOwnProperty( x ) ) continue;

				toReturn[ i + '.' + x ] = flatObject[ x ];
			}
		} else {
			toReturn[ i ] = ob[ i ];
		}
	}
	return toReturn;
}

function compileStyles( styles = {} ) {
	const flattenedStyles = { ...flattenObject( styles ) };
	const html = [];
	html.push( ':root {' );

	for ( const key in flattenedStyles ) {
		const value = flattenedStyles[ key ];
		const style = `--wp-${ key.replace( /\./g, '-' ) }: ${ value };`;
		html.push( style );
	}
	html.push( '}' );

	html.push(
		'.editor-styles-wrapper { background-color: var(--wp-color-background); }'
	);

	return html.join( '\n' );
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
	const toPx = ( size ) =>
		`${ ( Math.pow( fontScale, size ) * fontSize ).toFixed( 2 ) }px`;

	return {
		fontSize: `${ fontSize }px`,
		fontSizeH1: toPx( 5 ),
		fontSizeH2: toPx( 4 ),
		fontSizeH3: toPx( 3 ),
		fontSizeH4: toPx( 2 ),
		fontSizeH5: toPx( 1 ),
		fontSizeH6: toPx( 0.5 ),
	};
}
