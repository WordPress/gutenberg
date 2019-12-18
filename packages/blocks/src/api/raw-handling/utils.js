/**
 * External dependencies
 */
import { mapValues, mergeWith, includes, noop, isFunction } from 'lodash';

/**
 * WordPress dependencies
 */
import { unwrap, insertAfter, remove } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { hasBlockSupport } from '..';
import { isPhrasingContent } from './phrasing-content';

/**
 * Browser dependencies
 */
const { ELEMENT_NODE, TEXT_NODE } = window.Node;

/**
 * Given raw transforms from blocks, merges all schemas into one.
 *
 * @param {Array}  transforms            Block transforms, of the `raw` type.
 * @param {Object} phrasingContentSchema The phrasing content schema.
 * @param {Object} isPaste               Whether the context is pasting or not.
 *
 * @return {Object} A complete block content schema.
 */
export function getBlockContentSchema( transforms, phrasingContentSchema, isPaste ) {
	const schemas = transforms.map( ( { isMatch, blockName, schema } ) => {
		const hasAnchorSupport = hasBlockSupport( blockName, 'anchor' );

		schema = isFunction( schema ) ? schema( { phrasingContentSchema, isPaste } ) : schema;

		// If the block does not has anchor support and the transform does not
		// provides an isMatch we can return the schema right away.
		if ( ! hasAnchorSupport && ! isMatch ) {
			return schema;
		}

		return mapValues( schema, ( value ) => {
			let attributes = value.attributes || [];
			// If the block supports the "anchor" functionality, it needs to keep its ID attribute.
			if ( hasAnchorSupport ) {
				attributes = [ ...attributes, 'id' ];
			}
			return {
				...value,
				attributes,
				isMatch: isMatch ? isMatch : undefined,
			};
		} );
	} );

	return mergeWith( {}, ...schemas, ( objValue, srcValue, key ) => {
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
	} );
}

/**
 * Recursively checks if an element is empty. An element is not empty if it
 * contains text or contains elements with attributes such as images.
 *
 * @param {Element} element The element to check.
 *
 * @return {boolean} Wether or not the element is empty.
 */
export function isEmpty( element ) {
	if ( ! element.hasChildNodes() ) {
		return true;
	}

	return Array.from( element.childNodes ).every( ( node ) => {
		if ( node.nodeType === TEXT_NODE ) {
			return ! node.nodeValue.trim();
		}

		if ( node.nodeType === ELEMENT_NODE ) {
			if ( node.nodeName === 'BR' ) {
				return true;
			} else if ( node.hasAttributes() ) {
				return false;
			}

			return isEmpty( node );
		}

		return true;
	} );
}

/**
 * Checks wether HTML can be considered plain text. That is, it does not contain
 * any elements that are not line breaks.
 *
 * @param {string} HTML The HTML to check.
 *
 * @return {boolean} Wether the HTML can be considered plain text.
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
 * Given a schema, unwraps or removes nodes, attributes and classes on a node
 * list.
 *
 * @param {NodeList} nodeList The nodeList to filter.
 * @param {Document} doc      The document of the nodeList.
 * @param {Object}   schema   An array of functions that can mutate with the provided node.
 * @param {Object}   inline   Whether to clean for inline mode.
 */
function cleanNodeList( nodeList, doc, schema, inline ) {
	Array.from( nodeList ).forEach( ( node ) => {
		const tag = node.nodeName.toLowerCase();

		// It's a valid child, if the tag exists in the schema without an isMatch
		// function, or with an isMatch function that matches the node.
		if (
			schema.hasOwnProperty( tag ) &&
			( ! schema[ tag ].isMatch || schema[ tag ].isMatch( node ) )
		) {
			if ( node.nodeType === ELEMENT_NODE ) {
				const {
					attributes = [],
					classes = [],
					children,
					require = [],
					allowEmpty,
				} = schema[ tag ];

				// If the node is empty and it's supposed to have children,
				// remove the node.
				if ( children && ! allowEmpty && isEmpty( node ) ) {
					remove( node );
					return;
				}

				if ( node.hasAttributes() ) {
					// Strip invalid attributes.
					Array.from( node.attributes ).forEach( ( { name } ) => {
						if ( name !== 'class' && ! includes( attributes, name ) ) {
							node.removeAttribute( name );
						}
					} );

					// Strip invalid classes.
					// In jsdom-jscore, 'node.classList' can be undefined.
					// TODO: Explore patching this in jsdom-jscore.
					if ( node.classList && node.classList.length ) {
						const mattchers = classes.map( ( item ) => {
							if ( typeof item === 'string' ) {
								return ( className ) => className === item;
							} else if ( item instanceof RegExp ) {
								return ( className ) => item.test( className );
							}

							return noop;
						} );

						Array.from( node.classList ).forEach( ( name ) => {
							if ( ! mattchers.some( ( isMatch ) => isMatch( name ) ) ) {
								node.classList.remove( name );
							}
						} );

						if ( ! node.classList.length ) {
							node.removeAttribute( 'class' );
						}
					}
				}

				if ( node.hasChildNodes() ) {
					// Do not filter any content.
					if ( children === '*' ) {
						return;
					}

					// Continue if the node is supposed to have children.
					if ( children ) {
						// If a parent requires certain children, but it does
						// not have them, drop the parent and continue.
						if ( require.length && ! node.querySelector( require.join( ',' ) ) ) {
							cleanNodeList( node.childNodes, doc, schema, inline );
							unwrap( node );
						// If the node is at the top, phrasing content, and
						// contains children that are block content, unwrap
						// the node because it is invalid.
						} else if (
							node.parentNode.nodeName === 'BODY' &&
							isPhrasingContent( node )
						) {
							cleanNodeList( node.childNodes, doc, schema, inline );

							if ( Array.from( node.childNodes ).some( ( child ) => ! isPhrasingContent( child ) ) ) {
								unwrap( node );
							}
						} else {
							cleanNodeList( node.childNodes, doc, children, inline );
						}
					// Remove children if the node is not supposed to have any.
					} else {
						while ( node.firstChild ) {
							remove( node.firstChild );
						}
					}
				}
			}
		// Invalid child. Continue with schema at the same place and unwrap.
		} else {
			cleanNodeList( node.childNodes, doc, schema, inline );

			// For inline mode, insert a line break when unwrapping nodes that
			// are not phrasing content.
			if ( inline && ! isPhrasingContent( node ) && node.nextElementSibling ) {
				insertAfter( doc.createElement( 'br' ), node );
			}

			unwrap( node );
		}
	} );
}

/**
 * Given a schema, unwraps or removes nodes, attributes and classes on HTML.
 *
 * @param {string} HTML   The HTML to clean up.
 * @param {Object} schema Schema for the HTML.
 * @param {Object} inline Whether to clean for inline mode.
 *
 * @return {string} The cleaned up HTML.
 */
export function removeInvalidHTML( HTML, schema, inline ) {
	const doc = document.implementation.createHTMLDocument( '' );

	doc.body.innerHTML = HTML;

	cleanNodeList( doc.body.childNodes, doc, schema, inline );

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
