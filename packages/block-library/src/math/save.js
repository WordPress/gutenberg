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
		const doc = document.implementation.createHTMLDocument( '' );
		doc.body.innerHTML = mathML;
		mathML = doc.body.querySelector( 'math' ).innerHTML;
	} catch ( err ) {
		return <div { ...useBlockProps.save() }>{ latex }</div>;
	}

	return (
		<math
			{ ...useBlockProps.save() }
			display="block"
			dangerouslySetInnerHTML={ { __html: mathML } }
		/>
	);
}
