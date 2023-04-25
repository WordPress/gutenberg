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
	messages: {
		anchorHasContent:
			'Anchors must have content and the content must be accessible by a screen reader. Check the first parameter to createInterpolateElement.',
		invalidMarkup:
			'The first parameter to createInterpolateElement does not contain valid markup for an anchor.',
		anchorHasHrefInterpolated:
			'The second parameter to createInterpolateElement must have an anchor with an href when using an anchor.',
	},
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
			const isAnchor =
				node?.key?.name === 'a' || node?.name?.name === 'a';
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

			// this should always just be one node, but we will receive an array anyway
			const nodeStr = textParam.arguments
				.map( ( a ) => getTextContentFromNode( a ) )
				.join( '' );
			const tags = getATagsContent( nodeStr );
			// if any of the anchors do not have content, we need to report an error like anchor-has-content does
			tags.forEach( ( content ) => {
				if ( content.length === 0 ) {
					context.report( {
						node: textParam,
						messageId: 'anchorHasContent',
					} );
				}
			} );
			/**
			 * If the string does not contain a valid anchor, we need to report an error like anchor-has-content does.
			 */
			if ( tags.length === 0 ) {
				context.report( {
					node: interpolatedEl,
					messageId: 'invalidMarkup',
				} );
			}
		},
	};
};

module.exports = {
	meta,
	create: rule,
};
