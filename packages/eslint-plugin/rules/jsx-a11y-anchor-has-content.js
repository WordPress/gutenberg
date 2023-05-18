/**
 *
 * @file Wraps eslint-plugin-jsx-a11y/anchor-has-content to allow usage with createInterpolateElement.
 *
 */

/**
 * External dependencies
 *
 * eslint-plugin-jsx-a11y/anchor-has-content: to create a wrapper around it, we need to use it
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
		url: 'https://github.com/WordPress/gutenberg/tree/HEAD/packages/eslint-plugin/docs/rules/jsx-a11y-anchor-has-content.md',
		description:
			'Checks that anchors are not empty and have an href, relies on jsx-a11y/anchor-has-content under the hood. Supports usage of createInterpolateElement.',
	},
	fixable: 'code',
	messages: {
		anchorIsEmpty:
			'Anchors must have content and the content must be accessible by a screen reader. Check the first parameter to createInterpolateElement.',
		invalidMarkup:
			'The first parameter to createInterpolateElement does not contain valid markup for an anchor.',
	},
	schema: [
		{
			type: 'object',
			properties: {
				components: {
					type: 'array',
					items: {
						type: 'string',
					},
					uniqueItems: true,
					additionalItems: false,
				},
			},
		},
	],
};

/**
 *
 * Verify that the content of anchors is not empty, and that we find an anchor in the markup. The anchors' content
 * can be from an <a> or other tags that are configured in the eslint 'component' rules (e.g. <MyAnchor>)
 *
 * @param {string} markup   markup used in createInterpolateElement
 * @param {string} tagNames names that we recognize as anchors, as configured in the eslint rules
 * @throws Error              an error if the markup does not contain a valid anchor or is empty
 */
const validateAnchorsContent = ( markup, tagNames ) => {
	const tagText = tagNames.join( '|' );
	const regex = new RegExp( `<(${ tagText })>(.*?)</(${ tagText })>`, 'g' );
	const tagParts = [ ...markup.matchAll( regex ) ];
	// if the string does not contain a valid anchor, we throw with an error message matching our rule's messageId
	tagParts.forEach( ( element ) => {
		// `<a> </a>` should not be valid, so we trim the content which would result in an empty string
		const contentIsEmpty = element[ 2 ].trim() === '';
		if ( contentIsEmpty ) throw new Error( 'anchorIsEmpty' );
	} );
	// For some reason the markup does not contain a valid anchor, and we throw an Error with the message matching our rule's messageIds
	if ( tagParts.length === 0 ) throw new Error( 'invalidMarkup' );
};

/**
 * Get the content of the first parameter to `createInterpolateElement
 *
 * @param {Node} node the first param of `createInterpolateElement`
 * @return {string|null} the content of the element, or null if we can't verify it
 */
const getInterpolatedNodeText = ( node ) => {
	let text = null;
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
			return null;
		}
		text = args.join( '' );
	} else if ( node.type === 'Literal' ) {
		text = getTextContentFromNode( node );
	}
	return text;
};
/**
 * A wrapper around eslint-plugin/anchor-has-content to allow usage with `createInterpolateElement`
 *
 * @param {*} context https://eslint.org/docs/latest/extend/custom-rules#the-context-object
 * @return {Object} the rule object
 */
const rule = function ( context ) {
	return {
		JSXOpeningElement: ( node ) => {
			/**
			 * Uses the custom components rules to determine if the node is an anchor or not.
			 */
			const options = context.options[ 0 ] || {};
			const componentOptions = options.components || [];
			const typeCheck = [ 'a' ].concat( componentOptions );
			if (
				// in theory we should never actually have a falsy value as a custom component option, but we do `&& type` just in case it happens
				typeCheck.filter(
					( type ) => type === node?.name?.name && type
				).length === 0
			) {
				// bail - we only care about anchors and custom components configured through rules
				return;
			}

			const interpolatedNode = context
				.getAncestors()
				.find(
					( n ) =>
						n.type === 'CallExpression' &&
						n.callee.name === 'createInterpolateElement'
				);

			if ( ! interpolatedNode ) {
				// wrap - not interpolated, carry on with the normal a11y anchor-has-content rule
				return anchorRule.create( context ).JSXOpeningElement( node );
			}
			// createInterpolateElement's 1st argument, which is the text to be interpolated
			// we may get a CallExpression, e.g: __('some text'), or a Literal e.g: 'some text'
			const textParam = interpolatedNode.arguments[ 0 ] ?? [];
			const interpolatedText = getInterpolatedNodeText( textParam );
			// bail if we can't get a string value, or if the string is empty
			if ( null === interpolatedText ) {
				return;
			}
			try {
				validateAnchorsContent( interpolatedText, typeCheck );
			} catch ( e ) {
				// if the error is not what we expect, something else went wrong and we should re-throw
				if ( ! meta.messages.hasOwnProperty( e.message ) ) {
					throw e;
				}
				context.report( {
					node: interpolatedNode,
					messageId: e.message,
				} );
			}
		},
	};
};

module.exports = {
	meta,
	create: rule,
};
