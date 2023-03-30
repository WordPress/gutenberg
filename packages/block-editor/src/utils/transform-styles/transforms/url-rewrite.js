/**
 * External dependencies
 */
import CSSValueParser from 'postcss-value-parser';

function recursivelyRewriteUrls( cssRules, rootURL ) {
	for ( const cssRule of cssRules ) {
		if ( cssRule.cssRules ) {
			recursivelyRewriteUrls( cssRule.cssRules, rootURL );
		}

		if ( ! cssRule.style || cssRule.style.length === 0 ) {
			continue;
		}
		rewriteUrls( cssRule.style, rootURL );
	}
}

function rewriteUrls( style, rootURL ) {
	for ( const propertyName of style ) {
		const propertyValue = style[ propertyName ];
		style[ propertyName ] = rewriteUrlInValue( propertyValue, rootURL );
	}
}

function rewriteUrlInValue( value, rootURL ) {
	const parsedValue = CSSValueParser( value );

	let valueChanged = false;
	parsedValue.walk( ( node ) => {
		if ( node.type === 'function' && node.value === 'url' ) {
			const urlVal = node.nodes[ 0 ].value;

			// bases relative URLs with rootURL
			const basedUrl = new URL( urlVal, rootURL );

			// skip host-relative, already normalized URLs (e.g. `/images/image.jpg`, without `..`s)
			if ( basedUrl.pathname === urlVal ) {
				return false; // skip this value
			}

			node.nodes[ 0 ].value = basedUrl.toString();
			valueChanged = true;

			return false; // do not walk deeper
		}
	} );

	if ( valueChanged ) {
		return CSSValueParser.stringify( parsedValue );
	}
	return value;
}

const rewrite = ( rootURL ) => ( cssstyleSheet ) => {
	recursivelyRewriteUrls( cssstyleSheet.cssRules, rootURL );
};

export default rewrite;
