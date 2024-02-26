/**
 * External dependencies
 */
import { h } from 'preact';
/**
 * Internal dependencies
 */
import { directivePrefix as p } from './constants';

const ignoreAttr = `data-${ p }-ignore`;
const islandAttr = `data-${ p }-interactive`;
const fullPrefix = `data-${ p }-`;
const namespaces = [];
const currentNamespace = () => namespaces[ namespaces.length - 1 ] ?? null;

// Regular expression for directive parsing.
const directiveParser = new RegExp(
	`^data-${ p }-` + // ${p} must be a prefix string, like 'wp'.
		// Match alphanumeric characters including hyphen-separated
		// segments. It excludes underscore intentionally to prevent confusion.
		// E.g., "custom-directive".
		'([a-z0-9]+(?:-[a-z0-9]+)*)' +
		// (Optional) Match '--' followed by any alphanumeric charachters. It
		// excludes underscore intentionally to prevent confusion, but it can
		// contain multiple hyphens. E.g., "--custom-prefix--with-more-info".
		'(?:--([a-z0-9_-]+))?$',
	'i' // Case insensitive.
);

// Regular expression for reference parsing. It can contain a namespace before
// the reference, separated by `::`, like `some-namespace::state.somePath`.
// Namespaces can contain any alphanumeric characters, hyphens, underscores or
// forward slashes. References don't have any restrictions.
const nsPathRegExp = /^([\w-_\/]+)::(.+)$/;

export const hydratedIslands = new WeakSet();

/**
 * Recursive function that transforms a DOM tree into vDOM.
 *
 * @param {Node} root The root element or node to start traversing on.
 * @return {import('preact').VNode[]} The resulting vDOM tree.
 */
export function toVdom( root ) {
	const treeWalker = document.createTreeWalker(
		root,
		205 // ELEMENT + TEXT + COMMENT + CDATA_SECTION + PROCESSING_INSTRUCTION
	);

	function walk( node ) {
		const { attributes, nodeType, localName } = node;

		if ( nodeType === 3 ) return [ node.data ];
		if ( nodeType === 4 ) {
			const next = treeWalker.nextSibling();
			node.replaceWith( new window.Text( node.nodeValue ) );
			return [ node.nodeValue, next ];
		}
		if ( nodeType === 8 || nodeType === 7 ) {
			const next = treeWalker.nextSibling();
			node.remove();
			return [ null, next ];
		}

		const props: Record< string, any > = {};
		const children = [];
		const directives = [];
		let ignore = false;
		let island = false;

		for ( let i = 0; i < attributes.length; i++ ) {
			const n = attributes[ i ].name;
			if (
				n[ fullPrefix.length ] &&
				n.slice( 0, fullPrefix.length ) === fullPrefix
			) {
				if ( n === ignoreAttr ) {
					ignore = true;
				} else {
					let [ ns, value ] = nsPathRegExp
						.exec( attributes[ i ].value )
						?.slice( 1 ) ?? [ null, attributes[ i ].value ];
					try {
						value = JSON.parse( value );
					} catch ( e ) {}
					if ( n === islandAttr ) {
						island = true;
						namespaces.push(
							typeof value === 'string'
								? value
								: value?.namespace ?? null
						);
					} else {
						directives.push( [ n, ns, value ] );
					}
				}
			} else if ( n === 'ref' ) {
				continue;
			}
			props[ n ] = attributes[ i ].value;
		}

		if ( ignore && ! island )
			return [
				h( localName, {
					...props,
					innerHTML: node.innerHTML,
					__directives: { ignore: true },
				} ),
			];
		if ( island ) hydratedIslands.add( node );

		if ( directives.length ) {
			props.__directives = directives.reduce(
				( obj, [ name, ns, value ] ) => {
					const [ , prefix, suffix = 'default' ] =
						directiveParser.exec( name );
					if ( ! obj[ prefix ] ) obj[ prefix ] = [];
					obj[ prefix ].push( {
						namespace: ns ?? currentNamespace(),
						value,
						suffix,
					} );
					return obj;
				},
				{}
			);
		}

		if ( localName === 'template' ) {
			props.content = [ ...node.content.childNodes ].map( ( childNode ) =>
				toVdom( childNode )
			);
		} else {
			let child = treeWalker.firstChild();
			if ( child ) {
				while ( child ) {
					const [ vnode, nextChild ] = walk( child );
					if ( vnode ) children.push( vnode );
					child = nextChild || treeWalker.nextSibling();
				}
				treeWalker.parentNode();
			}
		}

		// Restore previous namespace.
		if ( island ) namespaces.pop();

		return [ h( localName, props, children ) ];
	}

	return walk( treeWalker.currentNode );
}
