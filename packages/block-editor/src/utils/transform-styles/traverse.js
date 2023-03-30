/**
 * Internal dependencies
 */
import { recurseCssRules } from './parse/ast';
import { createStyleElem, textFromStyleSheet } from './parse/stylesheets';

function traverseCSS( css, callback ) {
	try {
		const styleEl = createStyleElem( css );
		const cssstyleSheet = styleEl.sheet;

		if ( ! cssstyleSheet.cssRules ) {
			return css;
		}
		recurseCssRules( cssstyleSheet, callback );

		const cssOut = textFromStyleSheet( cssstyleSheet );
		styleEl.remove(); // clean up
		return cssOut;
	} catch ( err ) {
		// eslint-disable-next-line no-console
		console.warn( 'Error while traversing the CSS: ' + err );

		return null;
	}
}

export default traverseCSS;
