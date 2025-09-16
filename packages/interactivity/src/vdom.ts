/**
 * External dependencies
 */
import { h, type ComponentChild, type JSX } from 'preact';
/**
 * Internal dependencies
 */
import { directivePrefix as p } from './constants';
import { warn } from './utils';
import { type DirectiveEntry } from './hooks';

const ignoreAttr = `data-${ p }-ignore`;
const islandAttr = `data-${ p }-interactive`;
const fullPrefix = `data-${ p }-`;
const namespaces: Array< string | null > = [];
const currentNamespace = () => namespaces[ namespaces.length - 1 ] ?? null;
const isObject = ( item: unknown ): item is Record< string, unknown > =>
	Boolean( item && typeof item === 'object' && item.constructor === Object );

/**
 * This regex pattern must be kept in sync with the server-side implementation in
 * wp-includes/interactivity-api/class-wp-interactivity-api.php.
 *
 * The pattern validates directive attribute names to ensure consistency between
 * client and server processing. Invalid directive names (containing characters like
 * square brackets or colons) should be ignored by both client and server.
 *
 * @see https://github.com/WordPress/wordpress-develop/blob/trunk/src/wp-includes/interactivity-api/class-wp-interactivity-api.php
 */
const directiveParser = new RegExp(
	`^data-${ p }-` + // ${p} must be a prefix string, like 'wp'.
		// Match alphanumeric characters including hyphen-separated
		// segments. It excludes underscore intentionally to prevent confusion.
		// E.g., "custom-directive".
		'([a-z0-9]+(?:-[a-z0-9]+)*)' +
		// (Optional) Match '--' followed by any alphanumeric characters. It
		// excludes underscore intentionally to prevent confusion, but it can
		// contain multiple hyphens. E.g., "--custom-prefix--with-more-info".
		'(?:--([a-z0-9_-]+))?$',
	'i' // Case insensitive.
);

// Regular expression for reference parsing. It can contain a namespace before
// the reference, separated by `::`, like `some-namespace::state.somePath`.
// Namespaces can contain any alphanumeric characters, hyphens, underscores or
// forward slashes. References don't have any restrictions.
const nsPathRegExp = /^([\w_\/-]+)::(.+)$/;

export const hydratedIslands = new WeakSet();

/**
 * Recursive function that transforms a DOM tree into vDOM.
 *
 * @param root The root element or node to start traversing on.
 * @return The resulting vDOM tree.
 */
export function toVdom( root: Node ): ComponentChild {
	const nodesToRemove = new Set< Node >();
	const nodesToReplace = new Set< Node >();

	const treeWalker = document.createTreeWalker(
		root,
		205 // TEXT + CDATA_SECTION + COMMENT + PROCESSING_INSTRUCTION + ELEMENT
	);

	function walk( node: Node ): ComponentChild | null {
		const { nodeType } = node;

		// TEXT_NODE (3)
		if ( nodeType === 3 ) {
			return ( node as Text ).data;
		}

		// CDATA_SECTION_NODE (4)
		if ( nodeType === 4 ) {
			nodesToReplace.add( node );
			return node.nodeValue;
		}

		// COMMENT_NODE (8) || PROCESSING_INSTRUCTION_NODE (7)
		if ( nodeType === 8 || nodeType === 7 ) {
			nodesToRemove.add( node );
			return null;
		}

		const elementNode = node as HTMLElement;
		const { attributes } = elementNode;
		const localName = elementNode.localName as keyof JSX.IntrinsicElements;

		const props: Record< string, any > = {};
		const children: Array< ComponentChild > = [];
		const directives: Array<
			[ name: string, namespace: string | null, value: unknown ]
		> = [];
		let ignore = false;
		let island = false;

		for ( let i = 0; i < attributes.length; i++ ) {
			const attributeName = attributes[ i ].name;
			const attributeValue = attributes[ i ].value;
			if (
				attributeName[ fullPrefix.length ] &&
				attributeName.slice( 0, fullPrefix.length ) === fullPrefix
			) {
				if ( attributeName === ignoreAttr ) {
					ignore = true;
				} else {
					const regexResult = nsPathRegExp.exec( attributeValue );
					const namespace = regexResult?.[ 1 ] ?? null;
					let value: any = regexResult?.[ 2 ] ?? attributeValue;
					try {
						const parsedValue = JSON.parse( value );
						value = isObject( parsedValue ) ? parsedValue : value;
					} catch {}
					if ( attributeName === islandAttr ) {
						island = true;
						const islandNamespace =
							// eslint-disable-next-line no-nested-ternary
							typeof value === 'string'
								? value
								: typeof value?.namespace === 'string'
								? value.namespace
								: null;
						namespaces.push( islandNamespace );
					} else {
						directives.push( [ attributeName, namespace, value ] );
					}
				}
			} else if ( attributeName === 'ref' ) {
				continue;
			}
			props[ attributeName ] = attributeValue;
		}

		if ( ignore && ! island ) {
			return [
				h< any, any >( localName, {
					...props,
					innerHTML: elementNode.innerHTML,
					__directives: { ignore: true },
				} ),
			];
		}
		if ( island ) {
			hydratedIslands.add( elementNode );
		}

		if ( directives.length ) {
			props.__directives = directives.reduce<
				Record< string, Array< DirectiveEntry > >
			>( ( obj, [ name, ns, value ] ) => {
				const directiveMatch = directiveParser.exec( name );
				if ( directiveMatch === null ) {
					warn( `Found malformed directive name: ${ name }.` );
					return obj;
				}
				const prefix = directiveMatch[ 1 ] || '';
				const suffix = directiveMatch[ 2 ] || null;

				obj[ prefix ] = obj[ prefix ] || [];
				obj[ prefix ].push( {
					namespace: ns ?? currentNamespace()!,
					value: value as DirectiveEntry[ 'value' ],
					suffix,
				} );
				return obj;
			}, {} );
		}

		if ( localName === 'template' ) {
			props.content = [
				...( elementNode as HTMLTemplateElement ).content.childNodes,
			].map( ( childNode ) => toVdom( childNode ) );
		} else {
			let child = treeWalker.firstChild();
			if ( child ) {
				while ( child ) {
					const vnode = walk( child );
					if ( vnode ) {
						children.push( vnode );
					}
					child = treeWalker.nextSibling();
				}
				treeWalker.parentNode();
			}
		}

		// Restore previous namespace.
		if ( island ) {
			namespaces.pop();
		}

		return h( localName, props, children );
	}

	const vdom = walk( treeWalker.currentNode );

	nodesToRemove.forEach( ( node: Node ) =>
		( node as Comment | ProcessingInstruction ).remove()
	);
	nodesToReplace.forEach( ( node: Node ) =>
		( node as CDATASection ).replaceWith(
			new window.Text( ( node as CDATASection ).nodeValue ?? '' )
		)
	);

	return vdom;
}
