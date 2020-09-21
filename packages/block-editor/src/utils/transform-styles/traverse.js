/**
 * External dependencies
 */
import csstree from 'css-tree';

function traverseCSS( css, callback ) {
	try {
		const ast = csstree.parse( css );
		csstree.walk( ast, callback );
		return csstree.generate( ast );
	} catch ( err ) {
		// eslint-disable-next-line no-console
		console.warn( 'Error while traversing the CSS: ' + err );

		return null;
	}
}

export default traverseCSS;
