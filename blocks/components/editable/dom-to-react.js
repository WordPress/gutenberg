import { createElement } from 'react';
import { map, reduce } from 'lodash';
import camelCaseAttrMap from 'html-to-react/lib/camel-case-attribute-names';

export function nodeToReact( node, index ) {
	if ( node.nodeName === '#text' ) {
		return node.nodeValue;
	}

	const type = node.nodeName.toLowerCase();
	const children = map( node.childNodes || [], nodeToReact );
	const props = reduce( node.attributes, ( result, { name, value } ) => {
		let key = camelCaseAttrMap[ name.replace( /[-:]/, '' ) ] || name;

		if ( key === 'style' ) {
			return result;
		}

		if ( key === 'class' ) {
			key = 'className';
		}

		result[ key ] = value;

		return result;
	}, { key: index } );

	return createElement.call( null, type, props, ...children );
}
