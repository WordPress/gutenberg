/**
 * External dependencies
 */
import { map } from 'lodash';

export function serialize( nodes ) {
	return map( nodes, ( node ) => {
		switch ( node.type ) {
			case 'WP_Block':
				return (
					'<!-- wp:' + node.blockType + ' ' +
					map( node.attrs, ( value, key ) => (
						`${ key }:${ value } `
					) ) +
					'-->' +
					serialize( node.children ) +
					'<!-- /wp -->'
				);

			case 'HTML_Tag':
				return [
					node.startText,
					serialize( node.children ),
					node.endText
				].join( '' );

			case 'HTML_Tag_Open':
				return node.text;
		}

		return node.value;
	} ).join( '' );
}
