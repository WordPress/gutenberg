import { createElement } from 'react';
import { map, reduce } from 'lodash';
import camelCaseAttrMap from 'html-to-react/lib/camel-case-attribute-names';

export function nodeToReact( node, index ) {
	if ( ! node ) {
		return null;
	}

	if ( node.nodeName === '#text' ) {
		return node.nodeValue;
	}

	if ( node.getAttribute( 'data-mce-bogus' ) === 'all' ) {
		return null;
	}

	const type = node.nodeName.toLowerCase();
	const children = map( node.childNodes || [], nodeToReact );
	const props = reduce( node.attributes, ( result, { name, value } ) => {
		let key = camelCaseAttrMap[ name.replace( /[-:]/, '' ) ] || name;

		if ( key.startsWith( 'data-mce-' ) ) {
			return result;
		}

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
