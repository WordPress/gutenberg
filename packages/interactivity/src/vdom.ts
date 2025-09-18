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
		// (Optional) Match the rest of the directive (suffix and/or unique ID).
		// This must be empty OR start with '--' (suffix or suffix+unique) OR start with '---' (unique only)
		'((?:--[a-z0-9_-]+(?:---[a-z0-9_-]+)?|---[a-z0-9_-]+)?)$',
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
				const rest = directiveMatch[ 2 ] || '';

				// Parse suffix and unique ID from the rest
				let suffix: string | null = null;
				let uniqueId: string | undefined;

				if ( rest ) {
					// Check for unique ID pattern (---uniqueId)
					const uniqueIdMatch = rest.match( /---([a-z0-9_-]+)$/i );
					if ( uniqueIdMatch ) {
						uniqueId = uniqueIdMatch[ 1 ];
						// Remove the unique ID part to get potential suffix
						const suffixPart = rest.replace(
							/---[a-z0-9_-]+$/i,
							''
						);
						if ( suffixPart && suffixPart.startsWith( '--' ) ) {
							suffix = suffixPart.substring( 2 ); // Remove '--'
						}
					} else if ( rest.startsWith( '--' ) ) {
						// Only suffix, no unique ID
						suffix = rest.substring( 2 ); // Remove '--'

						// Warning for potentially confusing patterns
						// If the suffix looks like it could be a unique ID (simple identifier)
						// and this is a directive that supports unique IDs, warn about the new syntax
						if (
							suffix &&
							/^[a-z0-9][a-z0-9_-]*$/i.test( suffix ) &&
							[
								'context',
								'watch',
								'init',
								'on',
								'on-async',
								'run',
							].includes( prefix )
						) {
							// Only warn if this looks like a simple identifier that could be a unique ID
							// Don't warn for obvious suffixes like 'click', 'hover', etc. for event handlers
							const isLikelyEventSuffix =
								prefix === 'on' &&
								[
									'click',
									'hover',
									'focus',
									'blur',
									'submit',
									'change',
									'input',
									'keydown',
									'keyup',
									'load',
									'resize',
									'scroll',
								].includes( suffix );

							if ( ! isLikelyEventSuffix && suffix.length > 3 ) {
								warn(
									`Directive "${ name }" uses "--${ suffix }" which could be confused with a unique ID. ` +
										'For unique IDs, use triple dashes: "---' +
										suffix +
										'". ' +
										'The double-dash syntax is reserved for directive suffixes.'
								);
							}
						}
					}
				}

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
