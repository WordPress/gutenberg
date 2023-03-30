/**
 * External dependencies
 */
import CSSValueParser from 'postcss-value-parser';

const rewrite = ( rootUrl ) => ( cssRule ) => {
	// eslint-disable-next-line no-undef
	if ( ! ( cssRule instanceof CSSStyleRule ) || ! cssRule.style ) {
		return cssRule;
	}

	for ( let i = 0; i < cssRule.style.length; i++ ) {
		const propertyName = cssRule.style[ i ];

		const propertyValue = cssRule.style.getPropertyValue( propertyName );
		const propertyPriority =
			cssRule.style.getPropertyPriority( propertyName );

		const newPropertyValue = rewriteUrlsInValue( propertyValue, rootUrl );

		cssRule.style.setProperty(
			propertyName,
			newPropertyValue,
			propertyPriority
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
