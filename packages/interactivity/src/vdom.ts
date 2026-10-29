import { h, type ComponentChild, type JSX } from 'preact';
import { warn, isReservedKey, jsonReviver } from './utils';
import { type DirectiveEntry } from './hooks';

const directivePrefix = `data-wp-`;
const namespaces: Array< string | null > = [];
const currentNamespace = () => namespaces[ namespaces.length - 1 ] ?? null;
const isObject = ( item: unknown ): item is Record< string, unknown > =>
	Boolean( item && typeof item === 'object' && item.constructor === Object );
const invalidCharsRegex = /[^a-z0-9-_]/i;

/**
 * Checks whether a directive name part is reserved after trimming hyphens and
 * lowercasing it, as `kebabToCamelCase()` does: `data-wp-each--constructor-`
 * names the item `constructor`.
 *
 * Directive names, suffixes, unique IDs and namespaces become property keys:
 * `data-wp-bind--[attribute]`, for example, assigns to the element's props.
 *
 * @param part Part of a directive name.
 * @return Whether the part is reserved.
 */
const isReservedNamePart = ( part: string ): boolean =>
	isReservedKey( part.replace( /^-+|-+$/g, '' ).toLowerCase() );

function parseDirectiveName( directiveName: string ): {
	prefix: string;
	suffix: string | null;
	uniqueId: string | null;
} | null {
	const parsed = splitDirectiveName( directiveName );
	if (
		parsed &&
		( isReservedNamePart( parsed.prefix ) ||
			( parsed.suffix !== null &&
				parsed.suffix.split( '--' ).some( isReservedNamePart ) ) ||
			( parsed.uniqueId !== null &&
				isReservedNamePart( parsed.uniqueId ) ) )
	) {
		return null;
	}
	return parsed;
}

function splitDirectiveName( directiveName: string ): {
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
	// A prefix cannot start with "-" and a leading "--" is empty.
	if ( suffixIndex === 0 || name[ 0 ] === '-' ) {
		return null;
	}

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

/**
 * Parses the namespace and value from a directive attribute value.
 *
 * JSON is retained only when it produces a plain object. All other values use
 * the raw value after any namespace prefix has been removed. Keys named
 * `__proto__` are removed from the parsed JSON.
 *
 * @param rawValue The raw directive attribute value.
 * @return An object with the optional `namespace` and interpreted `value`.
 */
export function parseDirectiveValue( rawValue: string ): {
	namespace: string | null;
	value: string | Record< string, unknown >;
} {
	const regexResult = nsPathRegExp.exec( rawValue );
	const namespace = regexResult?.[ 1 ] ?? null;
	const rawDirectiveValue = regexResult?.[ 2 ] ?? rawValue;
	let value: string | Record< string, unknown > = rawDirectiveValue;

	// The parsed value is only ever used if it is a plain object, so a value
	// can only be worth parsing if it starts with `{` (allowing leading
	// whitespace, which JSON.parse tolerates for values set via setAttribute).
	// This gates the common case of plain string values (e.g.
	// `data-wp-interactive="myplugin"`), avoiding the relatively expensive
	// SyntaxError that JSON.parse throws for every non-JSON value.
	if ( /^\s*\{/.test( rawDirectiveValue ) ) {
		try {
			const parsedValue: unknown = JSON.parse(
				rawDirectiveValue,
				jsonReviver
			);
			if ( isObject( parsedValue ) ) {
				value = parsedValue;
			}
		} catch {}
	}

	return { namespace, value };
}

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
 * Directive attributes are interpreted with {@link parseDirectiveValue}.
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
			return ( node as CDATASection ).data;
		}

		// COMMENT_NODE (8) || PROCESSING_INSTRUCTION_NODE (7)
		if ( nodeType === 8 || nodeType === 7 ) {
			nodesToRemove.add( node );
			return null;
		}

		const elementNode = node as HTMLElement;
		const localName = elementNode.localName as keyof JSX.IntrinsicElements;

		const props: Record< string, any > = {};
		const children: Array< ComponentChild > = [];
		const directives: Array<
			[ name: string, namespace: string | null, value: unknown ]
		> = [];
		let island = false;

		// `getAttributeNames()` copies the attribute names into a plain JS
		// array, which is much faster than per-attribute access to the live
		// NamedNodeMap (`attributes[ i ].name` / `.value`): each index access
		// and property read crosses the JS/DOM boundary and may allocate an
		// `Attr` wrapper object.
		const attributeNames = elementNode.getAttributeNames();
		for ( let i = 0; i < attributeNames.length; i++ ) {
			const attributeName = attributeNames[ i ];
			const attributeValue =
				elementNode.getAttribute( attributeName ) ?? '';
			if (
				attributeName[ directivePrefix.length ] &&
				attributeName.slice( 0, directivePrefix.length ) ===
					directivePrefix
			) {
				if ( globalThis.SCRIPT_DEBUG ) {
					if ( attributeName === 'data-wp-ignore' ) {
						warn(
							'The data-wp-ignore directive has been removed. The element and its descendants are now hydrated like any other element. Please remove the attribute.'
						);
					}
				}
				const { namespace, value } =
					parseDirectiveValue( attributeValue );
				if ( attributeName === 'data-wp-interactive' ) {
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
				// Directive attributes are never boolean properties, so skip
				// the boolean check below and assign the value directly.
				props[ attributeName ] = attributeValue;
				continue;
			} else if ( attributeName === 'ref' ) {
				continue;
			}
			// For boolean attributes with empty string values, use `true`.
			// This prevents Preact from coercing "" to false. Camelcase
			// mismatches (readonly→readOnly) are `undefined`, not `true`,
			// falling through to Preact's setAttribute path, which handles them
			// correctly: https://github.com/preactjs/preact/blob/bf7a195ac4b1706468e876e41b27428e3d8a08f3/src/diff/props.js#L114
			if (
				attributeValue === '' &&
				elementNode[ attributeName ] === true
			) {
				props[ attributeName ] = true;
			} else {
				props[ attributeName ] = attributeValue;
			}
		}

		if ( directives.length ) {
			// Keyed by directive names from the markup, so it has no prototype.
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
			}, Object.create( null ) );
			directiveMaps.add( props.__directives );

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

		if ( props.__directives?.html ) {
			const conflictingPrefixes = [
				'text',
				'each',
				'router-region',
			].filter( ( prefix ) => prefix in props.__directives );
			if ( conflictingPrefixes.length ) {
				warn(
					`The data-wp-html directive was ignored because it conflicts with ${ conflictingPrefixes.map( ( prefix ) => `data-wp-${ prefix }` ).join( ', ' ) }.`
				);
				delete props.__directives.html;
			}
		}

		const hasDefaultHtmlDirective = props.__directives?.html?.some(
			( { suffix }: DirectiveEntry ) => suffix === null
		);

		if ( props.__directives?.[ 'each-child' ] || hasDefaultHtmlDirective ) {
			// `data-wp-html` owns this element's content entirely — whether
			// that's still the server-rendered fallback or HTML the
			// directive has since applied — so it's treated as opaque here,
			// the same way `each-child` is: don't walk its children into
			// vnodes, since the directive writes to the DOM directly rather
			// than through Preact's own props diffing (see
			// `directives/html.ts`).
			props.dangerouslySetInnerHTML = {
				__html: elementNode.innerHTML,
			};
		} else if ( localName === 'template' ) {
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
			new window.Text( ( node as CDATASection ).data )
		)
	);

	return vdom;
}
