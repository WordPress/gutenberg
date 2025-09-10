/**
 * WordPress dependencies
 */
import { useStyleOverride } from '@wordpress/block-editor';

const calculatePositionStyles = ( position ) => {
	console.log('calculatePositionStyles', position);
	switch ( position ) {
		case 'top left':
			return `margin-top: 1em; margin-left: 1em;`;
		case 'top center':
			return `margin-top: 1em;`;
		case 'top right':
			return `margin-top: 1em; margin-right: 1em;`;
		case 'center left':
			return `margin-left: 1em;`;
		case 'center right':
			return `margin-right: 1em;`;
		case 'bottom left':
			return `margin-bottom: 1em; margin-left: 1em;`;
		case 'bottom center':
			return `margin-bottom: 1em;`;
		case 'bottom right':
			return `margin-bottom: 1em; margin-right: 1em;`;
		default:
			return '';
	}
}

/**
 * Injects backdrop color CSS custom properties for the dialog-element block, mirroring the pattern
 * used by tabs color styles (scoped to `#block-{ clientId }`). This replaces the prior
 * inline-style object return value approach so that these values participate in
 * style engine cascade like other dynamic style overrides.
 *
 * @param {Object} props
 * @param {Object} props.attributes Block attributes
 * @param {string} props.clientId   Block client ID
 * @returns {null} No UI output
 */
export default function ColorStyles( { attributes, clientId } ) {
	if ( ! clientId ) {
		return null;
	}

	const {
		customBackdropColor,
		animationDuration,
		dialogPosition,
	} = attributes || {};

	// Helper to normalize color objects (preset { slug } vs direct value).
	function getColorValue( color ) {
		if ( ! color ) {
			return null;
		}
		if ( typeof color === 'object' && color.slug ) {
			return `var(--wp--preset--color--${ color.slug })`;
		}
		return color;
	}

	const cssMap = {
		'--wp--style--dialog-backdrop-color': getColorValue( customBackdropColor ),
		'--wp--style--dialog-animation-duration': animationDuration ? `${ animationDuration }ms` : null,
	};

	// Build scoped CSS only for defined values to avoid unnecessary empty declarations.
	let declarations = Object.entries( cssMap )
		.filter( ( [ , value ] ) => !! value )
		.map( ( [ name, value ] ) => `\t${ name }: ${ value };` )
		.join( '\n' );

	declarations += calculatePositionStyles( dialogPosition );

	if ( declarations.length ) {
		useStyleOverride( {
			css: `#block-${ clientId } {\n${ declarations }\n}`,
		} );
	}

	return null;
}
