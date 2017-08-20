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

export default function( HTML ) {
	const doc = document.implementation.createHTMLDocument( '' );

	doc.body.innerHTML = HTML;

	const wrappers = doc.body.querySelectorAll( tags );

	Array.from( wrappers ).forEach( ( wrapper ) => unwrap( wrapper ) );

	return doc.body.innerHTML;
}
