/**
 * Internal dependencies
 */
import { recurseCssRules } from './parse/ast';

function traverseCSS( sheet, callback ) {
	try {
		if ( ! sheet.cssRules ) {
			return;
		}
		recurseCssRules( sheet, callback );
	} catch ( err ) {
		// eslint-disable-next-line no-console
		console.warn( 'Error while traversing the CSS: ' + err );

		return null;
	}
}

export default traverseCSS;
