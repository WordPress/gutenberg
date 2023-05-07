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
const {
	getTextContentFromNode,
	getTranslateFunctionName,
	getTranslateFunctionArgs,
} = require( '../utils' );

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
	},
	schema: [], // no options
};

/**
 *
 * @param {string} tags markup used in createInterpolateElement
 * @return {Array} an array of the content of the <a> tags
 */
const getATagsContent = ( tags ) => {
	const tagParts = [ ...tags.matchAll( /<a>(.*?)<\/a>/g ) ];
	return tagParts.map( ( element ) => {
		return element[ 1 ].trim();
	} );
};

/**
 *
 * @param {Node} node the first param of createInterpolateElement
 * @return {string|null} a string of the content of the node
 */
const getValueFromInterpolateElement = ( node ) => {
	let nodeStr = null;
	let args = [];
	if ( node.type === 'CallExpression' ) {
		const argFunctionName = getTranslateFunctionName( node.callee );
		// get text if we are going through a translate function
		args = getTranslateFunctionArgs(
			argFunctionName,
			node.arguments,
			false
		).map( getTextContentFromNode );
		// An unknown function call in a translate function may produce a valid string
		// but verifying it is not straight-forward, so we bail
		if ( args.filter( Boolean ).length === 0 ) {
			nodeStr = null;
		}
		nodeStr = args.join( '' );
	} else if ( node.type === 'Literal' ) {
		nodeStr = getTextContentFromNode( node );
	}
	return nodeStr;
};

const rule = function ( context ) {
	return {
		JSXOpeningElement: ( node ) => {
			if ( node?.name?.name !== 'a' ) {
				// bail - we only care about anchors
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
				// wrap - not interpolated, carry on with the normal a11y anchor-has-content rule
				return anchorRule.create( context ).JSXOpeningElement( node );
			}
			// createInterpolateElement's 1st argument, which is the text to be interpolated
			// we may get a CallExpression, e.g: __('some text'), or a Literal e.g: 'some text'
			const textParam = interpolatedEl.arguments[ 0 ] ?? [];
			const nodeStr = getValueFromInterpolateElement( textParam );
			// bail if we can't get a string value, or if the string is empty
			if ( null === nodeStr ) {
				return;
			}
			const tags = getATagsContent( nodeStr );
			// if any of the anchors do not have content,
			// we need to report an error like anchor-has-content does
			tags.forEach( ( content ) => {
				if ( content.length === 0 ) {
					context.report( {
						node: textParam,
						messageId: 'anchorHasContent',
					} );
				}
			} );
			// If the string does not contain a valid anchor,
			// we need to report an error like anchor-has-content does.
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
