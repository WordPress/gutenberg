/**
 *
 * @file Wraps eslint-plugin-jsx-a11y/anchor-has-content to allow usage with createInterpolateElement.
 *
 */

/**
 * External dependencies
 *
 * eslint-plugin-jsx-a11y/anchor-has-content: to create a wrapper around it, we need to use it
 * elementType from jsx-ast-utils: to get the type of the node we are working with.
 */
const anchorRule = require( 'eslint-plugin-jsx-a11y' ).rules[
	'anchor-has-content'
];

/**
 * Internal dependencies
 */
const { getTextContentFromNode } = require( '../utils' );
const meta = {
	type: 'problem',
	docs: {
		description:
			'Checks that anchors are not empty and have an href, relies on eslint-plugin-jsx-a11y/anchor-has-content under the hood. Supports usage of createInterpolateElement.',
	},
	fixable: 'code',
	schema: [], // no options
};

const getATagsContent = ( str ) => {
	const tagParts = [ ...str.matchAll( /<a>(.*?)<\/a>/g ) ];
	return tagParts.map( ( element ) => {
		return element[ 1 ].trim();
	} );
};

const rule = function ( context ) {
	return {
		JSXOpeningElement: ( node ) => {
			const isAnchor = node?.key?.name === 'a';
			if ( ! isAnchor ) {
				// not an anchor, so we don't care
				return;
			}
			const interpolatedEl = context
				.getAncestors()
				.find(
					( n ) =>
						n.type === 'CallExpression' &&
						n.callee.name === 'createInterpolateElement'
				);
			if ( ! interpolatedEl ) {
				// not interpolated, carry on with the normal a11y anchor-has-content rule
				return anchorRule.create( context ).JSXOpeningElement( node );
			}
			// createInterpolateElement's 1st argument (a string with markup).
			const textParam = interpolatedEl.arguments[ 0 ] ?? [];
			// createInterpolateElement's 2nd argument (a conversion map).
			const hasTagProperties =
				interpolatedEl.arguments[ 1 ]?.properties?.find(
					( e ) => e.key.name === 'a'
				);
			if ( ! hasTagProperties ) {
				// createInterpolateElement throws an error when there is an invalid or missing conversion map (2nd arg)
				// but we still throw a lint error here in case we can catch some classes of problems early
				context.report( {
					node: interpolatedEl,
					message:
						'The second parameter to createInterpolateElement must have an anchor with an href in it when interpolation an anchor.',
				} );
			}
			// this should always just be one node, but we will receive an array anyway
			const nodeStr = textParam.arguments
				.map( ( a ) => getTextContentFromNode( a ) )
				.join( '' );
			// if any of the anchors do not have content, we need to report an error like anchor-has-content does
			getATagsContent( nodeStr ).forEach( ( content ) => {
				if ( content.length === 0 ) {
					context.report( {
						node: textParam,
						message:
							'Anchors must have content and the content must be accessible by a screen reader. Check the first parameter to createInterpolateElement.',
					} );
				}
			} );
			/**
			 * If the string does not contain a valid anchor, we need to report an error like anchor-has-content does.
			 */
			const unmatched = ! (
				nodeStr.includes( '<a>' ) && nodeStr.includes( '</a>' )
			);
			if ( unmatched ) {
				context.report( {
					node: interpolatedEl,
					message:
						'The first parameter to createInterpolateElement does not contain valid markup for an anchor.',
				} );
			}
		},
	};
};

module.exports = {
	meta,
	create: rule,
};
