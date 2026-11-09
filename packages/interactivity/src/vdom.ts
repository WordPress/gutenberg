import { h, type ComponentChild, type JSX, type VNode } from 'preact';
import { warn, isReservedKey, jsonReviver } from './utils';
import { type DirectiveEntry } from './hooks';

/** Associates opaque HTML props with script-free snapshots owned by the live document's template-contents document. */
const htmlFallbacks = new WeakMap< object, DocumentFragment >();
/** Opaque HTML props whose snapshot holds an element's server-rendered content, not `<template>` content. */
const htmlServerContents = new WeakSet< object >();
/** Number of `<template>` element contents being converted around the current conversion. */
let templateContentDepth = 0;

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

/**
 * Splits a directive attribute name into its prefix, suffix and unique ID.
 *
 * @param directiveName The full attribute name, starting with `data-wp-`.
 * @return The parsed name, or null when the part after `data-wp-` contains
 *         unsupported characters, starts with a hyphen or has a reserved part.
 */
export function parseDirectiveName( directiveName: string ): {
	/** The directive name, such as `on` in `data-wp-on--click`. */
	prefix: string;
	/** The suffix after `--`, or null when absent or empty. */
	suffix: string | null;
	/** The unique ID after `---`, or null when absent or empty. */
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

export const hydratedIslands = new WeakSet();

/**
 * Copies a node tree into the target's owner document, omitting script
 * elements recursively. HTML-namespace template contents are traversed
 * separately because they are not ordinary child nodes of their template
 * element; elements named `template` in other namespaces use their child nodes.
 *
 * @param source The node whose child nodes are copied.
 * @param target The fragment or cloned node that receives those children.
 */
function copyFallbackChildren( source: Node, target: Node ): void {
	for ( const child of Array.from( source.childNodes ) ) {
		if (
			child.nodeType === 1 &&
			( child as Element ).localName === 'script'
		) {
			continue;
		}

		// Import directly into the snapshot owner, without creating a node in
		// the source document or retaining that document through the snapshot.
		const clone = target.ownerDocument!.importNode( child, false );
		target.appendChild( clone );
		if (
			child.nodeType === 1 &&
			( child as Element ).namespaceURI ===
				'http://www.w3.org/1999/xhtml' &&
			( child as Element ).localName === 'template'
		) {
			copyFallbackChildren(
				( child as HTMLTemplateElement ).content,
				( clone as HTMLTemplateElement ).content
			);
		} else {
			copyFallbackChildren( child, clone );
		}
	}
}

/**
 * Gets the inert template-contents document associated with the live document.
 *
 * @return The live document's shared template-contents owner document.
 */
function getTemplateContentsOwnerDocument(): Document {
	return document.createElement( 'template' ).content.ownerDocument;
}

/**
 * Reads the script-free fallback snapshot recorded for an element vnode. The
 * snapshot is owned by the live document's shared template-contents document.
 * Callers must leave it detached and unmodified; insert a clone.
 *
 * @param element The element vnode passed to a directive callback.
 * @return The detached fallback snapshot, or `undefined` when absent.
 */
export function getHtmlFallback(
	element: VNode< any >
): DocumentFragment | undefined {
	const htmlProps = element.props.dangerouslySetInnerHTML;
	return htmlProps && htmlFallbacks.get( htmlProps );
}

/**
 * Reads the script-free snapshot of an element's server-rendered content: the
 * snapshot that {@link getHtmlFallback} returns, when `toVdom()` built the
 * vnode from markup outside every `<template>` element's content. Callers must
 * leave it detached and unmodified; insert a clone.
 *
 * @param element The element vnode passed to a directive callback.
 * @return The detached snapshot, or `undefined` for a vnode built from
 *         `<template>` content or not built by `toVdom()`.
 */
export function getHtmlServerContent(
	element: VNode< any >
): DocumentFragment | undefined {
	const htmlProps = element.props.dangerouslySetInnerHTML;
	return htmlProps && htmlServerContents.has( htmlProps )
		? htmlFallbacks.get( htmlProps )
		: undefined;
}

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
 * Gets the namespace named by the parsed value of a `data-wp-interactive`
 * attribute: the value itself when it is a string, or the `namespace` string of
 * an object. It is the single place that interprets these values, so
 * {@link toVdom} and its callers resolve a `data-wp-interactive` attribute to
 * the same namespace.
 *
 * @param value The `value` returned by {@link parseDirectiveValue} for the
 *              attribute.
 * @return The namespace, or null when the value names none or a reserved key.
 */
export const getInteractiveNamespace = (
	value: string | Record< string, unknown >
): string | null => {
	const namespace =
		// eslint-disable-next-line no-nested-ternary
		typeof value === 'string'
			? value
			: typeof value?.namespace === 'string'
				? value.namespace
				: null;
	return isReservedKey( namespace ) ? null : namespace;
};

/**
 * Recursive function that transforms a DOM tree into vDOM.
 * Directive attributes are interpreted with {@link parseDirectiveValue}.
 *
 * Unprefixed directives get the namespace of the nearest `data-wp-interactive`
 * at or above their element within `root`. Where there is none, the namespace
 * passed as `namespace` applies, as if `root` sat inside a
 * `data-wp-interactive` that names it; `null` stands for no namespace. When
 * `namespace` is omitted, the namespace in effect where the conversion is
 * requested applies: the enclosing conversion's for `<template>` content, and
 * `null` for a top-level call. The ancestors of `root` are never read. A
 * namespace prefix in a directive value always takes precedence.
 *
 * @example
 * ```js
 * // The directives of the region resolve against `my-plugin`, the namespace
 * // of the interactive element that contains it.
 * toVdom( region, 'my-plugin' );
 * ```
 *
 * @param root      The root element or node to start traversing on.
 * @param namespace Optional namespace for the unprefixed directives that no
 *                  `data-wp-interactive` within `root` governs.
 * @return The resulting vDOM tree.
 */
export function toVdom(
	root: Node,
	namespace?: string | null
): ComponentChild {
	if ( namespace === undefined ) {
		return convertToVdom( root );
	}
	namespaces.push( namespace );
	try {
		return convertToVdom( root );
	} finally {
		namespaces.pop();
	}
}

function convertToVdom( root: Node ): ComponentChild {
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
					namespaces.push( getInteractiveNamespace( value ) );
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

		if ( island ) {
			hydratedIslands.add( elementNode );
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
			const htmlProps = {
				__html: elementNode.innerHTML,
			};
			props.dangerouslySetInnerHTML = htmlProps;
			if ( hasDefaultHtmlDirective ) {
				// Preserve a script-free snapshot in the live document's shared
				// template-contents document. Importing directly there neither
				// requests fallback resources nor keeps a parsed page alive.
				const snapshot =
					getTemplateContentsOwnerDocument().createDocumentFragment();
				copyFallbackChildren( elementNode, snapshot );
				htmlFallbacks.set( htmlProps, snapshot );
				if ( ! templateContentDepth ) {
					htmlServerContents.add( htmlProps );
				}
			}
		} else if ( localName === 'template' ) {
			templateContentDepth++;
			try {
				props.content = [
					...( elementNode as HTMLTemplateElement ).content
						.childNodes,
				].map( ( childNode ) => toVdom( childNode ) );
			} finally {
				templateContentDepth--;
			}
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
