/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

/**
 * External dependencies
 */
import temml from 'temml';

export default function save( { attributes } ) {
	const { latex } = attributes;

	if ( ! latex ) {
		return null;
	}

	let mathML = '';
	try {
		mathML = temml.renderToString( latex, {
			displayMode: true,
			annotate: true,
			throwOnError: true,
		} );
	} catch ( err ) {
		mathML = latex;
	}

	// Extract the MathML content (remove outer <math> tag)
	const match = mathML.match( /<math[^>]*>(.*)<\/math>/s );
	const innerHTML = match ? match[ 1 ] : mathML;

	return (
		<math
			{ ...useBlockProps.save() }
			display="block"
			dangerouslySetInnerHTML={ { __html: innerHTML } }
		/>
	);
}
