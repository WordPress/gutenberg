/**
 * WordPress dependencies
 */
import { useStyleOverride } from '@wordpress/block-editor';

/**
 * Injects backdrop color CSS custom properties for the dialog-element block, mirroring the pattern
 * used by tabs color styles (scoped to `#block-{ clientId }`). This replaces the prior
 * inline-style object return value approach so that these values participate in
 * style engine cascade like other dynamic style overrides.
 *
 * @param {Object} props
 * @param {Object} props.attributes Block attributes
 * @param {string} props.clientId   Block client ID
 * @return {null} No UI output
 */
export default function ColorStyles( { attributes, clientId } ) {
	const { customBackdropColor } = attributes || {};

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
		'--wp--style--dialog-backdrop-color':
			getColorValue( customBackdropColor ),
	};

	// Build scoped CSS only for defined values to avoid unnecessary empty declarations.
	const declarations = Object.entries( cssMap )
		.filter( ( [ , value ] ) => !! value )
		.map( ( [ name, value ] ) => `\t${ name }: ${ value };` )
		.join( '\n' );

	useStyleOverride( {
		css:
			declarations.length && clientId
				? `#block-${ clientId } {\n${ declarations }\n}`
				: '',
	} );

	return null;
}
