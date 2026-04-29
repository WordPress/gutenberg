/**
 * WordPress dependencies
 */
import { isPhrasingContent, getPhrasingContentSchema } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { hasBlockSupport } from '..';
import { getRawTransforms } from './get-raw-transforms';
import type { NodeFilterFunction } from './types';

export function getBlockContentSchemaFromTransforms(
	transforms: any[],
	context?: string
) {
	const phrasingContentSchema = getPhrasingContentSchema( context );
	const schemaArgs = { phrasingContentSchema, isPaste: context === 'paste' };
	const schemas = transforms.map( ( { isMatch, blockName, schema } ) => {
		const hasAnchorSupport = hasBlockSupport( blockName, 'anchor' );

		schema = typeof schema === 'function' ? schema( schemaArgs ) : schema;

		// If the block does not has anchor support and the transform does not
		// provides an isMatch we can return the schema right away.
		if ( ! hasAnchorSupport && ! isMatch ) {
			return schema;
		}

		if ( ! schema ) {
			return {};
		}

		return Object.fromEntries(
			Object.entries( schema ).map( ( [ key, value ]: any[] ) => {
				let attributes = ( value as any ).attributes || [];
				// If the block supports the "anchor" functionality, it needs to keep its ID attribute.
				if ( hasAnchorSupport ) {
					attributes = [ ...attributes, 'id' ];
				}
				return [
					key,
					{
						...value,
						attributes,
						isMatch: isMatch ? isMatch : undefined,
					},
				];
			} )
		);
	} );

	function mergeTagNameSchemaProperties(
		objValue: any,
		srcValue: any,
		key: string
	) {
		switch ( key ) {
			case 'children': {
				if ( objValue === '*' || srcValue === '*' ) {
					return '*';
				}

				return mergeSchemas(
					{ ...( objValue || {} ) },
					srcValue || {}
				);
			}
			case 'attributes':
			case 'require': {
				return Array.from(
					new Set( [ ...( objValue || [] ), ...( srcValue || [] ) ] )
				);
			}
			case 'isMatch': {
				// If one of the values being merge is undefined (matches everything),
				// the result of the merge will be undefined.
				if ( ! objValue || ! srcValue ) {
					return undefined;
				}
				// When merging two isMatch functions, the result is a new function
				// that returns if one of the source functions returns true.
				return ( ...args: any[] ) => {
					return objValue( ...args ) || srcValue( ...args );
				};
			}
			case 'classes': {
				if (
					( objValue || [] ).includes( '*' ) ||
					( srcValue || [] ).includes( '*' )
				) {
					return [ '*' ];
				}

				return [ ...( objValue || [] ), ...( srcValue || [] ) ];
			}
		}
	}

	// A tagName schema is an object with children, attributes, require, and
	// isMatch properties.
	function mergeTagNameSchemas( a: any, b: any ) {
		if ( a === b ) {
			return a;
		}

		for ( const key in b ) {
			if ( a[ key ] ) {
				a[ key ] = mergeTagNameSchemaProperties(
					a[ key ],
					b[ key ],
					key
				);
			} else if ( Array.isArray( b[ key ] ) ) {
				a[ key ] = b[ key ].slice();
			} else {
				a[ key ] = { ...b[ key ] };
			}
		}

		return a;
	}

	// A schema is an object with tagName schemas by tag name.
	function mergeSchemas( a: any, b: any ) {
		if ( a === b ) {
			return a;
		}

		for ( const key in b ) {
			if ( a[ key ] ) {
				a[ key ] = mergeTagNameSchemas( a[ key ], b[ key ] );
			} else if ( Array.isArray( b[ key ] ) ) {
				a[ key ] = b[ key ].slice();
			} else {
				a[ key ] = { ...b[ key ] };
			}
		}

		return a;
	}

	return schemas.reduce( mergeSchemas, {} );
}

/**
 * Gets the block content schema, which is extracted and merged from all
 * registered blocks with raw transforms.
 *
 * @param context Set to "paste" when in paste context, where the
 *                schema is more strict.
 *
 * @return A complete block content schema.
 */
export function getBlockContentSchema( context?: string ) {
	return getBlockContentSchemaFromTransforms( getRawTransforms(), context );
}

/**
 * Checks whether the given element is a non-semantic wrapper. A non-semantic
 * wrapper is a `<span>` or `<div>` element that has no `class`, `id`, `role`,
 * `data-*`, or `aria-*` attribute. Plugins and themes commonly use those
 * attributes to drive custom raw transforms (e.g. converting
 * `<div class="box">` to a custom block), so wrappers carrying them must be
 * preserved instead of being unwrapped. Other attributes (e.g. `style`,
 * `title`, `lang`, `dir`) are ignored for this check.
 *
 * @param element The element to check.
 *
 * @return Whether the element is a non-semantic wrapper.
 */
function isNonSemanticWrapper( element: Element ) {
	const { tagName } = element;
	if ( tagName !== 'SPAN' && tagName !== 'DIV' ) {
		return false;
	}
	for ( const { name } of element.attributes ) {
		if (
			name === 'class' ||
			name === 'id' ||
			name === 'role' ||
			name.startsWith( 'data-' ) ||
			name.startsWith( 'aria-' )
		) {
			return false;
		}
	}
	return true;
}

/**
 * Checks whether HTML can be considered plain text. That is, it does not contain
 * any elements that are not line breaks, or it only contains non-semantic
 * wrapper elements (span/div without semantic attributes) with no semantic
 * child elements.
 *
 * @param HTML The HTML to check.
 *
 * @return Whether the HTML can be considered plain text.
 */
export function isPlain( HTML: string ) {
	if ( ! /<(?!br[ />])/i.test( HTML ) ) {
		return true;
	}

	const doc = document.implementation.createHTMLDocument( '' );
	doc.body.innerHTML = HTML;

	if ( doc.body.children.length !== 1 ) {
		return false;
	}

	const wrapper = doc.body.children.item( 0 )!;

	if ( ! isNonSemanticWrapper( wrapper ) ) {
		return false;
	}

	const descendants = wrapper.getElementsByTagName( '*' );
	for ( let i = 0; i < descendants.length; i++ ) {
		const descendant = descendants.item( i )!;
		if ( descendant.tagName === 'BR' ) {
			continue;
		}
		if ( ! isNonSemanticWrapper( descendant ) ) {
			return false;
		}
	}

	return true;
}

export type { NodeFilterFunction } from './types';

/**
 * Given node filters, deeply filters and mutates a NodeList.
 *
 * @param nodeList The nodeList to filter.
 * @param filters  An array of functions that can mutate with the provided node.
 * @param doc      The document of the nodeList.
 * @param schema   The schema to use.
 */
export function deepFilterNodeList(
	nodeList: NodeList,
	filters: NodeFilterFunction[],
	doc: Document,
	schema?: Record< string, unknown >
) {
	Array.from( nodeList ).forEach( ( node ) => {
		deepFilterNodeList( node.childNodes, filters, doc, schema );

		filters.forEach( ( item ) => {
			// Make sure the node is still attached to the document.
			if ( ! doc.contains( node ) ) {
				return;
			}

			item( node, doc, schema );
		} );
	} );
}

/**
 * Given node filters, deeply filters HTML tags.
 * Filters from the deepest nodes to the top.
 *
 * @param HTML    The HTML to filter.
 * @param filters An array of functions that can mutate with the provided node.
 * @param schema  The schema to use.
 *
 * @return The filtered HTML.
 */
export function deepFilterHTML(
	HTML: string,
	filters: NodeFilterFunction[] = [],
	schema?: Record< string, unknown >
) {
	const doc = document.implementation.createHTMLDocument( '' );

	doc.body.innerHTML = HTML;

	deepFilterNodeList( doc.body.childNodes, filters, doc, schema );

	return doc.body.innerHTML;
}

/**
 * Gets a sibling within text-level context.
 *
 * @param node  The subject node.
 * @param which "next" or "previous".
 */
export function getSibling( node: Node, which: string ): Node | undefined {
	const sibling = ( node as any )[ `${ which }Sibling` ] as Node | undefined;

	if ( sibling && isPhrasingContent( sibling ) ) {
		return sibling;
	}

	const { parentNode } = node;

	if ( ! parentNode || ! isPhrasingContent( parentNode ) ) {
		return;
	}

	return getSibling( parentNode, which );
}
