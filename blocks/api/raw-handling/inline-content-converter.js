/**
 * Browser dependencies
 */
const { ELEMENT_NODE } = window.Node;

/**
 * Internal dependencies
 */
import { isInlineWrapper, isInline, isAllowedBlock, deepFilterNodeList } from './utils';
import createUnwrapper from './create-unwrapper';

export default function( node, doc ) {
	if ( node.nodeType !== ELEMENT_NODE ) {
		return;
	}

	if ( ! isInlineWrapper( node ) ) {
		return;
	}

	deepFilterNodeList( node.childNodes, [
		createUnwrapper(
			( childNode ) => ! isInline( childNode ) && ! isAllowedBlock( node, childNode ),
			( childNode ) => childNode.nextElementSibling && doc.createElement( 'BR' )
		),
	], doc );
}
