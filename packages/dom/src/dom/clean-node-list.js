/**
 * External dependencies
 */
import { includes, noop } from 'lodash';

/**
 * Internal dependencies
 */
import isEmpty from './is-empty';
import remove from './remove';
import unwrap from './unwrap';
import { isPhrasingContent } from '../phrasing-content';
import insertAfter from './insert-after';

/**
 * Given a schema, unwraps or removes nodes, attributes and classes on a node
 * list.
 *
 * @param {NodeList} nodeList The nodeList to filter.
 * @param {Document} doc      The document of the nodeList.
 * @param {Object}   schema   An array of functions that can mutate with the provided node.
 * @param {Object}   inline   Whether to clean for inline mode.
 */
export default function cleanNodeList( nodeList, doc, schema, inline ) {
	Array.from( nodeList ).forEach( ( node ) => {
		const tag = node.nodeName.toLowerCase();

		// It's a valid child, if the tag exists in the schema without an isMatch
		// function, or with an isMatch function that matches the node.
		if (
			schema.hasOwnProperty( tag ) &&
			( ! schema[ tag ].isMatch || schema[ tag ].isMatch( node ) )
		) {
			if ( node.nodeType === node.ELEMENT_NODE ) {
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
						if (
							name !== 'class' &&
							! includes( attributes, name )
						) {
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
							if (
								! mattchers.some( ( isMatch ) =>
									isMatch( name )
								)
							) {
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
						if (
							require.length &&
							! node.querySelector( require.join( ',' ) )
						) {
							cleanNodeList(
								node.childNodes,
								doc,
								schema,
								inline
							);
							unwrap( node );
							// If the node is at the top, phrasing content, and
							// contains children that are block content, unwrap
							// the node because it is invalid.
						} else if (
							node.parentNode.nodeName === 'BODY' &&
							isPhrasingContent( node )
						) {
							cleanNodeList(
								node.childNodes,
								doc,
								schema,
								inline
							);

							if (
								Array.from( node.childNodes ).some(
									( child ) => ! isPhrasingContent( child )
								)
							) {
								unwrap( node );
							}
						} else {
							cleanNodeList(
								node.childNodes,
								doc,
								children,
								inline
							);
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
			if (
				inline &&
				! isPhrasingContent( node ) &&
				node.nextElementSibling
			) {
				insertAfter( doc.createElement( 'br' ), node );
			}

			unwrap( node );
		}
	} );
}
