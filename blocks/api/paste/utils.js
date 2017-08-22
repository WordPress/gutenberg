const inlineTags = [
	'strong',
	'em',
	'b',
	'i',
	'del',
	'ins',
	'a',
	'code',
	'abbr',
	'time',
	'sub',
	'sup',
	'br',
	'span',
];

const wrapperTags = [
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
];

export function isInline( node ) {
	return inlineTags.indexOf( node.nodeName.toLowerCase() ) !== -1;
}

export function isDoubleBR( node ) {
	return node.nodeName === 'BR' && node.previousSibling && node.previousSibling.nodeName === 'BR';
}

export function isSpan( node ) {
	return node.nodeName === 'SPAN';
}

export function isWrapper( node ) {
	return wrapperTags.indexOf( node.nodeName.toLowerCase() ) !== -1;
}

function deepFilterHelper( nodeList, filters ) {
	Array.from( nodeList ).forEach( ( node ) => {
		deepFilterHelper( node.childNodes, filters );

		filters.forEach( ( filter ) => {
			if ( ! node ) {
				return;
			}

			filter( node );
		} );
	} );
}

export function deepFilter( HTML, filters = [] ) {
	const doc = document.implementation.createHTMLDocument( '' );

	doc.body.innerHTML = HTML;

	deepFilterHelper( doc.body.childNodes, filters );

	return doc.body.innerHTML;
}
