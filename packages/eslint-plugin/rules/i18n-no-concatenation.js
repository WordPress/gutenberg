const {
	TRANSLATION_FUNCTIONS,
	getTextContentFromNode,
	getTranslateFunctionName,
} = require( '../utils' );

/**
 * Matches punctuation that ends a sentence, so that the text after it can be
 * translated separately.
 *
 * @type {RegExp}
 */
const REGEXP_SENTENCE_END = /[.!?…。！？]$/;

/**
 * Functions that return a translated string, or an element made from one,
 * when their first argument is a translated string.
 *
 * @type {Set<string>}
 */
const TRANSLATED_WRAPPER_FUNCTIONS = new Set( [
	'sprintf',
	'createInterpolateElement',
] );

/**
 * Elements that flow inline with the text around them, so that text inside
 * them and text next to them read as one sentence.
 *
 * @type {Set<string>}
 */
const INLINE_ELEMENTS = new Set( [
	'a',
	'abbr',
	'b',
	'bdi',
	'bdo',
	'cite',
	'code',
	'data',
	'del',
	'dfn',
	'em',
	'i',
	'ins',
	'kbd',
	'mark',
	'q',
	's',
	'samp',
	'small',
	'span',
	'strong',
	'sub',
	'sup',
	'time',
	'u',
	'var',
	'ExternalLink',
] );

/**
 * Returns whether a node evaluates to a translated string.
 *
 * @param {Object} node Node.
 *
 * @return {boolean} Whether the node is translated.
 */
function isTranslated( node ) {
	if ( ! node || node.type !== 'CallExpression' ) {
		return false;
	}

	const functionName = getTranslateFunctionName( node.callee );

	if ( TRANSLATION_FUNCTIONS.has( functionName ) ) {
		return true;
	}

	return (
		TRANSLATED_WRAPPER_FUNCTIONS.has( functionName ) &&
		isTranslated( node.arguments[ 0 ] )
	);
}

/**
 * Returns whether a string contains no text other than whitespace and HTML
 * tags, as in `'<strong>'` or `' '`.
 *
 * @param {string} string String.
 *
 * @return {boolean} Whether the string has no text.
 */
function hasNoText( string ) {
	return ! string.replace( /<[^>]*>/g, '' ).trim();
}

/**
 * Returns whether a node is a string literal made only of whitespace and HTML
 * tags.
 *
 * @param {Object} node Node.
 *
 * @return {boolean} Whether the node is a string without text.
 */
function isStringWithoutText( node ) {
	if ( node.type === 'Literal' ) {
		return typeof node.value === 'string' && hasNoText( node.value );
	}

	if ( node.type === 'TemplateLiteral' ) {
		return (
			node.expressions.length === 0 &&
			hasNoText( node.quasis[ 0 ].value.cooked ?? '' )
		);
	}

	return false;
}

/**
 * Returns the text that a translated node ends with, as far as it is known.
 *
 * @param {Object} node Translated node.
 *
 * @return {?string} The singular, or for plurals the plural, string.
 */
function getTranslatedText( node ) {
	const functionName = getTranslateFunctionName( node.callee );

	if ( TRANSLATED_WRAPPER_FUNCTIONS.has( functionName ) ) {
		return getTranslatedText( node.arguments[ 0 ] );
	}

	const textNode =
		functionName === '_n' || functionName === '_nx'
			? node.arguments[ 1 ]
			: node.arguments[ 0 ];
	const text = textNode && getTextContentFromNode( textNode );

	return typeof text === 'string' ? text : null;
}

/**
 * Returns the operands of a chain of `+` operations.
 *
 * @param {Object} node Node.
 *
 * @return {Object[]} Operands, from left to right.
 */
function getConcatenatedOperands( node ) {
	if ( node.type === 'BinaryExpression' && node.operator === '+' ) {
		return [
			...getConcatenatedOperands( node.left ),
			...getConcatenatedOperands( node.right ),
		];
	}

	return [ node ];
}

/**
 * Returns the name of a JSX element, such as `a` or `ExternalLink`.
 *
 * @param {Object} node JSXElement node.
 *
 * @return {?string} Element name, or `null` for a member or namespaced name.
 */
function getJsxElementName( node ) {
	const { name } = node.openingElement;
	return name.type === 'JSXIdentifier' ? name.name : null;
}

/**
 * Returns whether a JSX child contains a translated expression or text.
 *
 * @param {Object} node JSX child node.
 *
 * @return {boolean} Whether the node contains text.
 */
function containsText( node ) {
	if ( node.type === 'JSXText' ) {
		return !! node.value.trim();
	}

	if ( node.type === 'JSXExpressionContainer' ) {
		return isTranslated( node.expression );
	}

	if ( node.type === 'JSXElement' || node.type === 'JSXFragment' ) {
		return node.children.some( containsText );
	}

	return false;
}

/**
 * Splits the children of a JSX element or fragment into runs of inline
 * content, each read as one piece of text, keeping only the children that
 * contribute text: translated expressions, text, and inline elements
 * containing either. Other elements, such as `<br />` or `<p>`, end a run.
 *
 * @param {Object[]} children JSX child nodes.
 *
 * @return {Object[][]} Runs of text children.
 */
function getInlineRuns( children ) {
	const runs = [ [] ];

	for ( const child of children ) {
		if ( child.type === 'JSXElement' ) {
			if ( ! INLINE_ELEMENTS.has( getJsxElementName( child ) ) ) {
				runs.push( [] );
				continue;
			}
		} else if (
			child.type === 'JSXExpressionContainer' &&
			child.expression.type === 'JSXElement'
		) {
			continue;
		}

		if ( containsText( child ) ) {
			runs[ runs.length - 1 ].push( child );
		}
	}

	return runs;
}

/**
 * Returns whether a JSX child is a translated expression ending a sentence,
 * so that the text after it can be translated separately.
 *
 * @param {Object} node JSX child node.
 *
 * @return {boolean} Whether the node ends a sentence.
 */
function endsSentence( node ) {
	if (
		node.type !== 'JSXExpressionContainer' ||
		! isTranslated( node.expression )
	) {
		return false;
	}

	const text = getTranslatedText( node.expression );
	return text !== null && REGEXP_SENTENCE_END.test( text.trim() );
}

module.exports = {
	meta: {
		type: 'suggestion',
		schema: [],
		messages: {
			concatenated:
				'Translatable strings should not be combined with other text. Use a single translatable string with placeholders, and sprintf() or createInterpolateElement(), instead.',
		},
	},
	create( context ) {
		function checkJsxChildren( node ) {
			for ( const run of getInlineRuns( node.children ) ) {
				const translated = run.find(
					( child ) =>
						child.type === 'JSXExpressionContainer' &&
						isTranslated( child.expression )
				);

				if ( ! translated ) {
					continue;
				}

				const isCombined = run.some(
					( child, index ) =>
						index > 0 && ! endsSentence( run[ index - 1 ] )
				);

				if ( isCombined ) {
					context.report( {
						node: translated,
						messageId: 'concatenated',
					} );
				}
			}
		}

		return {
			BinaryExpression( node ) {
				if (
					node.operator !== '+' ||
					( node.parent.type === 'BinaryExpression' &&
						node.parent.operator === '+' )
				) {
					return;
				}

				const operands = getConcatenatedOperands( node );

				if (
					operands.some( isTranslated ) &&
					operands.filter(
						( operand ) => ! isStringWithoutText( operand )
					).length > 1
				) {
					context.report( {
						node,
						messageId: 'concatenated',
					} );
				}
			},
			TemplateLiteral( node ) {
				if (
					node.parent.type === 'TaggedTemplateExpression' ||
					! node.expressions.some( isTranslated )
				) {
					return;
				}

				const hasText = node.quasis.some(
					( quasi ) => ! hasNoText( quasi.value.cooked ?? '' )
				);

				if ( hasText || node.expressions.length > 1 ) {
					context.report( {
						node,
						messageId: 'concatenated',
					} );
				}
			},
			JSXElement: checkJsxChildren,
			JSXFragment: checkJsxChildren,
		};
	},
};
