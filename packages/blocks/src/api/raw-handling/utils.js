/**
 * WordPress dependencies
 */
import { isPhrasingContent, getPhrasingContentSchema } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { hasBlockSupport } from '..';
import { getRawTransforms } from './get-raw-transforms';

export function getBlockContentSchemaFromTransforms( transforms, context ) {
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
			Object.entries( schema ).map( ( [ key, value ] ) => {
				let attributes = value.attributes || [];
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

	function mergeTagNameSchemaProperties( objValue, srcValue, key ) {
		switch ( key ) {
			case 'children': {
				if ( objValue === '*' || srcValue === '*' ) {
					return '*';
				}

				return { ...objValue, ...srcValue };
			}
			case 'attributes':
			case 'require': {
				return [ ...( objValue || [] ), ...( srcValue || [] ) ];
			}
			case 'isMatch': {
				// If one of the values being merge is undefined (matches everything),
				// the result of the merge will be undefined.
				if ( ! objValue || ! srcValue ) {
					return undefined;
				}
				// When merging two isMatch functions, the result is a new function
				// that returns if one of the source functions returns true.
				return ( ...args ) => {
					return objValue( ...args ) || srcValue( ...args );
				};
			}
		}
	}

	// A tagName schema is an object with children, attributes, require, and
	// isMatch properties.
	function mergeTagNameSchemas( a, b ) {
		for ( const key in b ) {
			a[ key ] = a[ key ]
				? mergeTagNameSchemaProperties( a[ key ], b[ key ], key )
				: { ...b[ key ] };
		}
		return a;
	}

	// A schema is an object with tagName schemas by tag name.
	function mergeSchemas( a, b ) {
		for ( const key in b ) {
			a[ key ] = a[ key ]
				? mergeTagNameSchemas( a[ key ], b[ key ] )
				: { ...b[ key ] };
		}
		return a;
	}

	return schemas.reduce( mergeSchemas, {} );
}

/**
 * Gets the block content schema, which is extracted and merged from all
 * registered blocks with raw transforms.
 *
 * @param {string} context Set to "paste" when in paste context, where the
 *                         schema is more strict.
 *
 * @return {Object} A complete block content schema.
 */
export function getBlockContentSchema( context ) {
	return getBlockContentSchemaFromTransforms( getRawTransforms(), context );
}

/**
 * Checks whether HTML can be considered plain text. That is, it does not contain
 * any elements that are not line breaks.
 *
 * @param {string} HTML The HTML to check.
 *
 * @return {boolean} Whether the HTML can be considered plain text.
 */
export function isPlain( HTML ) {
	return ! /<(?!br[ />])/i.test( HTML );
}

/**
 * Given node filters, deeply filters and mutates a NodeList.
 *
 * @param {NodeList} nodeList The nodeList to filter.
 * @param {Array}    filters  An array of functions that can mutate with the provided node.
 * @param {Document} doc      The document of the nodeList.
 * @param {Object}   schema   The schema to use.
 */
export function deepFilterNodeList( nodeList, filters, doc, schema ) {
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
 * @param {string} HTML    The HTML to filter.
 * @param {Array}  filters An array of functions that can mutate with the provided node.
 * @param {Object} schema  The schema to use.
 *
 * @return {string} The filtered HTML.
 */
export function deepFilterHTML( HTML, filters = [], schema ) {
	const doc = document.implementation.createHTMLDocument( '' );

	doc.body.innerHTML = HTML;

	deepFilterNodeList( doc.body.childNodes, filters, doc, schema );

	return doc.body.innerHTML;
}

/**
 * Gets a sibling within text-level context.
 *
 * @param {Element} node  The subject node.
 * @param {string}  which "next" or "previous".
 */
export function getSibling( node, which ) {
	const sibling = node[ `${ which }Sibling` ];

	if ( sibling && isPhrasingContent( sibling ) ) {
		return sibling;
	}

	const { parentNode } = node;

	if ( ! parentNode || ! isPhrasingContent( parentNode ) ) {
		return;
	}

	return getSibling( parentNode, which );
}
