/**
 * External dependencies
 */
import CSSValueParser from 'postcss-value-parser';

const rewrite = ( rootUrl ) => ( cssRule ) => {
	if ( ! cssRule.style || cssRule.style.length === 0 ) {
		return cssRule;
	}

	for ( const propertyName of cssRule.style ) {
		const propertyValue = cssRule.style[ propertyName ];
		cssRule.style[ propertyName ] = rewriteUrlsInValue(
			propertyValue,
			rootUrl
		);
	}
	return cssRule;
};

function rewriteUrlsInValue( value, rootUrl ) {
	const parsedValue = CSSValueParser( value );

	let valueChanged = false;
	parsedValue.walk( ( node ) => {
		if ( node.type !== 'function' || node.value !== 'url' ) {
			return;
		}

		const urlVal = node.nodes[ 0 ].value;

		// bases relative URLs with rootUrl
		const basedUrl = new URL( urlVal, rootUrl );

		// skip host-relative, already normalized URLs (e.g. `/images/image.jpg`, without `..`s)
		if ( basedUrl.pathname === urlVal ) {
			return false; // skip this value
		}

		node.nodes[ 0 ].value = basedUrl.toString();
		valueChanged = true;

		return false; // do not walk deeper
	} );

	if ( valueChanged ) {
		return CSSValueParser.stringify( parsedValue );
	}
	return value;
}

export default rewrite;
