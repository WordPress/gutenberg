/**
 * External dependencies
 */
import { h, type ComponentChild, type JSX } from 'preact';
/**
 * Internal dependencies
 */
import { directivePrefix as p } from './constants';
import { warn, isReservedKey, jsonReviver } from './utils';
import { type DirectiveEntry } from './hooks';

const ignoreAttr = `data-${ p }-ignore`;
const islandAttr = `data-${ p }-interactive`;
const fullPrefix = `data-${ p }-`;
const namespaces: Array< string | null > = [];
const currentNamespace = () => namespaces[ namespaces.length - 1 ] ?? null;
const isObject = ( item: unknown ): item is Record< string, unknown > =>
	Boolean( item && typeof item === 'object' && item.constructor === Object );

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
const nsPathRegExp = /^([\w_\/-]+)::(.+)$/;

/**
 * Checks whether a directive name part is reserved after trimming hyphens and
 * lowercasing it, as `kebabToCamelCase()` does: `data-wp-each--constructor-`
 * names the item `constructor`.
 *
 * Directive names and suffixes become property keys: `data-wp-bind--[attribute]`,
 * for example, assigns to the element's props.
 *
 * @param part Part of a directive name.
 * @return Whether the part is reserved.
 */
const isReservedNamePart = ( part: string ): boolean =>
	isReservedKey( part.replace( /^-+|-+$/g, '' ).toLowerCase() );

export const hydratedIslands = new WeakSet();

const directiveMaps = new WeakSet< object >();

/**
 * Checks whether the passed value is a directive map created by `toVdom()`.
 *
 * @param value The value to check.
 * @return Whether the value is a directive map created by `toVdom()`.
 */
export const isDirectiveMap = ( value: unknown ): boolean =>
	typeof value === 'object' && value !== null && directiveMaps.has( value );

/**
 * Recursive function that transforms a DOM tree into vDOM.
 *
 * @param root The root element or node to start traversing on.
 * @return The resulting vDOM tree.
 */
export function toVdom( root: Node ): Array< ComponentChild > {
	const treeWalker = document.createTreeWalker(
		root,
		205 // TEXT + CDATA_SECTION + COMMENT + PROCESSING_INSTRUCTION + ELEMENT
	);

	function walk(
		node: Node
	): [ ComponentChild ] | [ ComponentChild, Node | null ] {
		const { nodeType } = node;

		// TEXT_NODE (3)
		if ( nodeType === 3 ) {
			return [ ( node as Text ).data ];
		}

		// CDATA_SECTION_NODE (4)
		if ( nodeType === 4 ) {
			const next = treeWalker.nextSibling();
			( node as CDATASection ).replaceWith(
				new window.Text( ( node as CDATASection ).nodeValue ?? '' )
			);
			return [ node.nodeValue, next ];
		}

		// COMMENT_NODE (8) || PROCESSING_INSTRUCTION_NODE (7)
		if ( nodeType === 8 || nodeType === 7 ) {
			const next = treeWalker.nextSibling();
			( node as Comment | ProcessingInstruction ).remove();
			return [ null, next ];
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
						const parsedValue = JSON.parse( value, jsonReviver );
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
						namespaces.push(
							isReservedKey( islandNamespace )
								? null
								: islandNamespace
						);
					} else if ( isReservedKey( namespace ) ) {
						if ( globalThis.SCRIPT_DEBUG ) {
							warn(
								`Found reserved namespace "${ namespace }" in directive: ${ attributeName }.`
							);
						}
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
			// Keyed by directive names, so it has no prototype.
			const ignoreDirectives = Object.assign( Object.create( null ), {
				ignore: true,
			} );
			directiveMaps.add( ignoreDirectives );
			return [
				h< any, any >( localName, {
					...props,
					innerHTML: elementNode.innerHTML,
					__directives: ignoreDirectives,
				} ),
			];
		}
		if ( island ) {
			hydratedIslands.add( elementNode );
		}

		if ( directives.length ) {
			// Keyed by directive names from the markup, so it has no prototype.
			props.__directives = directives.reduce<
				Record< string, Array< DirectiveEntry > >
			>( ( obj, [ name, ns, value ] ) => {
				const directiveMatch = directiveParser.exec( name );
				const prefix = directiveMatch?.[ 1 ] || '';
				const suffix = directiveMatch?.[ 2 ] || null;
				if (
					directiveMatch === null ||
					isReservedNamePart( prefix ) ||
					( suffix !== null &&
						suffix.split( '--' ).some( isReservedNamePart ) )
				) {
					warn( `Found malformed directive name: ${ name }.` );
					return obj;
				}

				obj[ prefix ] = obj[ prefix ] || [];
				obj[ prefix ].push( {
					namespace: ns ?? currentNamespace()!,
					value: value as DirectiveEntry[ 'value' ],
					suffix,
				} );
				return obj;
			}, Object.create( null ) );
			directiveMaps.add( props.__directives );
		}

		// @ts-expect-error Fixed in upcoming preact release https://github.com/preactjs/preact/pull/4334
		if ( localName === 'template' ) {
			props.content = [
				...( elementNode as HTMLTemplateElement ).content.childNodes,
			].map( ( childNode ) => toVdom( childNode ) );
		} else {
			let child = treeWalker.firstChild();
			if ( child ) {
				while ( child ) {
					const [ vnode, nextChild ] = walk( child );
					if ( vnode ) {
						children.push( vnode );
					}
					child = nextChild || treeWalker.nextSibling();
				}
				treeWalker.parentNode();
			}
		}

		// Restore previous namespace.
		if ( island ) {
			namespaces.pop();
		}

		return [ h( localName, props, children ) ];
	}

	return walk( treeWalker.currentNode );
}
