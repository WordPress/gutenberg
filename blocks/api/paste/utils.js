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

export function isInline( node ) {
	return inlineTags.indexOf( node.nodeName.toLowerCase() ) !== -1;
}

export function isDoubleBR( node ) {
	return node.nodeName === 'BR' && node.previousSibling && node.previousSibling.nodeName === 'BR';
}

export function unwrap( node ) {
	const parent = node.parentNode;

	while ( node.firstChild ) {
		parent.insertBefore( node.firstChild, node );
	}

	parent.removeChild( node );
}
