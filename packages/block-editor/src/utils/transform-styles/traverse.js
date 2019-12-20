/**
 * External dependencies
 */
import traverse from 'traverse';

/**
 * Internal dependencies
 */
import { parse, stringify } from './ast';

function traverseCSS( css, callback ) {
	try {
		const parsed = parse( css );

		const updated = traverse.map( parsed, function( node ) {
			if ( ! node ) {
				return node;
			}
			const updatedNode = callback( node );
			return this.update( updatedNode );
		} );

		return stringify( updated );
	} catch ( err ) {
		// eslint-disable-next-line no-console
		console.warn( 'Error while traversing the CSS: ' + err );

		return null;
	}
}

export default traverseCSS;
