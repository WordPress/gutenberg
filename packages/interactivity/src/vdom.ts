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
const invalidCharsRegex = /[^a-z0-9-_]/i;

function parseDirectiveName( directiveName: string ): {
	prefix: string;
	suffix: string | null;
	uniqueId: string | null;
} | null {
	const name = directiveName.substring( 8 );

	// If the name contains invalid characters, it's not a valid directive name.
	if ( invalidCharsRegex.test( name ) ) {
		return null;
	}

	// Finds the first "--" to separate the prefix.
	const suffixIndex = name.indexOf( '--' );

	// If "--" is not found, everything is part of the prefix.
	if ( suffixIndex === -1 ) {
		return { prefix: name, suffix: null, uniqueId: null };
	}

	// The prefix is the part before the first "--".
	const prefix = name.substring( 0, suffixIndex );
	// The remaining is the part that starts from "--".
	const remaining = name.substring( suffixIndex );

	// If the suffix starts with "---" (but not "----"), there is no suffix and
	// the remaining is the unique ID.
	if ( remaining.startsWith( '---' ) && remaining[ 3 ] !== '-' ) {
		return {
			prefix,
			suffix: null,
			uniqueId: remaining.substring( 3 ) || null,
		};
	}

	// Otherwise, the remaining is a potential suffix. The first two dashes are
	// removed.
	let suffix: string | null = remaining.substring( 2 );
	// Search for "---" for a unique ID within the suffix.
	const uniqueIdIndex = suffix.indexOf( '---' );

	// If "---" is found, split the suffix and the unique ID.
	if (
		uniqueIdIndex !== -1 &&
		suffix.substring( uniqueIdIndex )[ 3 ] !== '-'
	) {
		const uniqueId = suffix.substring( uniqueIdIndex + 3 ) || null;
		suffix = suffix.substring( 0, uniqueIdIndex ) || null;
		return { prefix, suffix, uniqueId };
	}

	// Otherwise, the rest is the entire suffix.
	return { prefix, suffix: suffix || null, uniqueId: null };
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
				const directiveParsed = parseDirectiveName( name );
				if ( directiveParsed === null ) {
					if ( globalThis.SCRIPT_DEBUG ) {
						warn( `Found malformed directive name: ${ name }.` );
					}
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

			// Sort directive arrays to ensure stable ordering across browsers.
			// Put nulls first, then sort by suffix and finally by uniqueIds.
			for ( const prefix in props.__directives ) {
				props.__directives[ prefix ].sort(
					( a: DirectiveEntry, b: DirectiveEntry ) => {
						const aSuffix = a.suffix ?? '';
						const bSuffix = b.suffix ?? '';
						if ( aSuffix !== bSuffix ) {
							return aSuffix < bSuffix ? -1 : 1;
						}
						const aId = a.uniqueId ?? '';
						const bId = b.uniqueId ?? '';
						return +( aId > bId ) - +( aId < bId );
					}
				);
			}
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
