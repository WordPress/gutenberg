const tags = [
	'span',
	'div',
	'article',
	'header',
	'footer',
	'section',
	'nav',
	'hgroup',
	'main',
	'aside',
].join( ',' );

function unwrap( node ) {
	const parent = node.parentNode;

	while ( node.firstChild ) {
		parent.insertBefore( node.firstChild, node );
	}

	parent.removeChild( node );
}

/**
 * @param  {Array} nodes Array of nodes.
 * @return {Array}       Array of nodes without any SPANs or DIVs.
 */
export default function( nodes ) {
	const fragment = document.createDocumentFragment();

	nodes.forEach( node => fragment.appendChild( node.cloneNode( true ) ) );

	const wrappers = fragment.querySelectorAll( tags );

	Array.from( wrappers ).forEach( ( wrapper ) => unwrap( wrapper ) );

	return Array.from( fragment.childNodes );
}
