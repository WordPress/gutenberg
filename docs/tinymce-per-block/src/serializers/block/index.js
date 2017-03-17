/**
 * External dependencies
 */
import { map } from 'lodash';

export function serialize( nodes ) {
	return map( nodes, ( node ) => {
		return (
			'<!-- wp:' + node.blockType + ' ' +
			map( node.attrs, ( value, key ) => (
				`${ key }:${ value } `
			) ) +
			'-->' +
			node.rawContent +
			'<!-- /wp -->'
		);
	} ).join( '' );
}
