import isEmpty from './is-empty';
import remove from './remove';
import unwrap from './unwrap';
import { isPhrasingContent } from '../phrasing-content';
import insertAfter from './insert-after';
import isElement from './is-element';
import type { Schema } from './types';

const noop = () => {};

/**
 * Given a schema, unwraps or removes nodes, attributes and classes on a node
 * list.
 *
 * @param nodeList The nodeList to filter.
 * @param doc      The document of the nodeList.
 * @param schema   Schema for the HTML.
 * @param inline   Whether to clean for inline mode.
 */
export default function cleanNodeList(
	nodeList: NodeList,
	doc: Document,
	schema: Schema,
	inline: boolean
) {
	Array.from( nodeList ).forEach(
		( node: Node & { nextElementSibling?: unknown } ) => {
			const tag = node.nodeName.toLowerCase();

			// It's a valid child, if the tag exists in the schema without an isMatch
			// function, or with an isMatch function that matches the node.
			if (
				schema.hasOwnProperty( tag ) &&
				( ! schema[ tag ].isMatch || schema[ tag ].isMatch?.( node ) )
			) {
				if ( isElement( node ) ) {
					const {
						attributes = [],
						classes = [],
						children,
						require = [],
						allowEmpty,
					} = schema[ tag ];

					// If the node is empty and it's supposed to have children,
					// remove the node. For phrasing content nodes that contain
					// only whitespace, unwrap instead to preserve the text.
					// See https://github.com/WordPress/gutenberg/issues/50898
					if ( children && ! allowEmpty && isEmpty( node ) ) {
						if (
							isPhrasingContent( node ) &&
							node.hasChildNodes()
						) {
							unwrap( node );
						} else {
							remove( node );
						}
						return;
					}

					if ( node.hasAttributes() ) {
						// Strip invalid attributes.
						Array.from( node.attributes ).forEach( ( { name } ) => {
							if (
								name !== 'class' &&
								! attributes.includes( name )
							) {
								node.removeAttribute( name );
							}
						} );

						// Strip invalid classes.
						// In jsdom-jscore, 'node.classList' can be undefined.
						// TODO: Explore patching this in jsdom-jscore.
						if ( node.classList && node.classList.length ) {
							const mattchers = classes.map( ( item ) => {
								if ( item === '*' ) {
									// Keep all classes.
									return () => true;
								} else if ( typeof item === 'string' ) {
									return ( className: string ) =>
										className === item;
								} else if ( item instanceof RegExp ) {
									return ( className: string ) =>
										item.test( className );
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
								node.parentNode &&
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
										( child ) =>
											! isPhrasingContent( child )
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
		}
	);
}
