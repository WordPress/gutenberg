/**
 * External dependencies
 */
import { h, type ComponentChild, type JSX } from 'preact';
/**
 * Internal dependencies
 */
import { warn } from './utils';
import { type DirectiveEntry } from './hooks';

const directivePrefix = `data-wp-`;
const namespaces: Array< string | null > = [];
const currentNamespace = () => namespaces[ namespaces.length - 1 ] ?? null;
const isObject = ( item: unknown ): item is Record< string, unknown > =>
	Boolean( item && typeof item === 'object' && item.constructor === Object );

function parseDirective( attributeName: string ): {
	prefix: string;
	suffix: string | null;
	uniqueId: string | null;
} | null {
	// Check if the attribute name starts with "data-wp-".
	const match = attributeName.match( /^data-wp-(.*)/i );
	if ( ! match ) {
		return null;
	}

	// Get the rest of the attribute name after "data-wp-".
	const rest = match[ 1 ];
	// Find the first "--" to separate the prefix from the rest.
	const delimIndex = rest.indexOf( '--' );

	// If "--" is not found, everything is part of the prefix.
	if ( delimIndex === -1 ) {
		return { prefix: rest, suffix: null, uniqueId: null };
	}

	// The prefix is the part before the first "--".
	const prefix = rest.substring( 0, delimIndex );
	// The rest is the part that starts from "--".
	const remaining = rest.substring( delimIndex );

	// Rule 1: If the rest starts with "---" (and not "----"),
	// there is no suffix and the rest is the unique ID.
	if ( remaining.startsWith( '---' ) && ! remaining.startsWith( '----' ) ) {
		return {
			prefix,
			suffix: null,
			uniqueId: remaining.substring( 3 ) || null,
		};
	}

	// Rule 2: Otherwise, the rest is a potential suffix.
	// The first two dashes are removed.
	const potentialSuffix = remaining.substring( 2 );
	// Search for "---" for a unique ID within the potential suffix.
	const idIndexInSuffix = potentialSuffix.indexOf( '---' );

	// If "---" is found (and not "----"), split the suffix and the unique ID.
	if (
		idIndexInSuffix !== -1 &&
		! potentialSuffix.substring( idIndexInSuffix ).startsWith( '----' )
	) {
		const suffix = potentialSuffix.substring( 0, idIndexInSuffix );
		const uniqueId =
			potentialSuffix.substring( idIndexInSuffix + 3 ) || null;
		return { prefix, suffix: suffix || null, uniqueId };
	}

	// If the potential suffix consists only of dashes, it is considered null.
	if ( /^-+$/.test( potentialSuffix ) ) {
		return { prefix, suffix: null, uniqueId: null };
	}

	// Otherwise, the entire potential suffix is the suffix.
	return { prefix, suffix: potentialSuffix || null, uniqueId: null };
}

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
				attributeName[ directivePrefix.length ] &&
				attributeName.slice( 0, directivePrefix.length ) ===
					directivePrefix
			) {
				if ( attributeName === 'data-wp-ignore' ) {
					ignore = true;
				} else {
					const regexResult = nsPathRegExp.exec( attributeValue );
					const namespace = regexResult?.[ 1 ] ?? null;
					let value: any = regexResult?.[ 2 ] ?? attributeValue;
					try {
						const parsedValue = JSON.parse( value );
						value = isObject( parsedValue ) ? parsedValue : value;
					} catch {}
					if ( attributeName === 'data-wp-interactive' ) {
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
				const directiveParsed = parseDirective( name );
				if ( directiveParsed === null ) {
					warn( `Found malformed directive name: ${ name }.` );
					return obj;
				}
				const { prefix, suffix, uniqueId } = directiveParsed;

				obj[ prefix ] = obj[ prefix ] || [];
				obj[ prefix ].push( {
					namespace: ns ?? currentNamespace()!,
					value: value as DirectiveEntry[ 'value' ],
					suffix,
					uniqueId,
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
