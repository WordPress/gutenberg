/**
 * Internal dependencies
 */
import { isPhrasingContent } from './phrasing-content';

function getSibling( node, which ) {
	const sibling = node[ `${ which }Sibling` ];

	if ( sibling ) {
		return sibling;
	}

	const { parentNode } = node;

	if ( ! parentNode ) {
		return;
	}

	if ( ! isPhrasingContent( parentNode ) ) {
		return;
	}

	return getSibling( parentNode, which );
}

function isFormattingSpace( character ) {
	return (
		character === ' ' ||
		character === '\t' ||
		character === '\n'
	);
}

/**
 * Looks for comments, and removes them.
 *
 * @param {Node} node The node to be processed.
 * @return {void}
 */
export default function( node ) {
	if ( node.nodeType !== node.TEXT_NODE ) {
		return;
	}

	if ( isFormattingSpace( node.data[ 0 ] ) ) {
		const previousSibling = getSibling( node, 'previous' );
		const hasPreviousSpace = (
			! previousSibling ||
			previousSibling.nodeName === 'BR' ||
			previousSibling.textContent.slice( -1 ) === ' '
		);
		node.data = node.data.replace( /^[ \n\t]+/, hasPreviousSpace ? '' : ' ' );
	}

	if ( isFormattingSpace( node.data.slice( -1 ) ) ) {
		const nextSibling = getSibling( node, 'next' );
		const hasNextSpace = (
			! nextSibling ||
			nextSibling.nodeName === 'BR' ||
			isFormattingSpace( nextSibling.textContent[ 0 ] )
		);
		node.data = node.data.replace( /[ \n\t]+$/, hasNextSpace ? '' : ' ' );
	}

	// Require at least two characters before attempting to replace formatting
	// spaces in the middle.
	if ( node.data.length > 2 ) {
		const middle = node.data.slice( 1, -1 );

		// Require at least two spaces in a row, a line break, or a tab
		// character before trying to replace anything.
		if (
			middle.indexOf( '  ' ) !== -1 ||
			middle.indexOf( '\n' ) !== -1 ||
			middle.indexOf( '\t' ) !== -1
		) {
			node.data = (
				node.data[ 0 ] +
				middle.replace( /[ \n\t]+/g, ' ' ) +
				node.data[ node.data.length - 1 ]
			);
		}
	}

	// If there's no data left, remove the node, so `previousSibling` stays
	// accurate.
	if ( ! node.data ) {
		node.parentNode.removeChild( node );
	}
}
