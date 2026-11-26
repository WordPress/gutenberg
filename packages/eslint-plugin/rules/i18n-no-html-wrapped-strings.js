const {
	TRANSLATION_FUNCTIONS,
	getTextContentFromNode,
	getTranslateFunctionName,
	getTranslateFunctionArgs,
} = require( '../utils' );
const {
	getSprintfPlaceholders,
} = require( '../utils/get-sprintf-placeholders' );

/**
 * Matches an opening tag at the start of a string, capturing the tag name and
 * its attributes.
 *
 * @type {RegExp}
 */
const REGEXP_OPENING_TAG =
	/^<([a-zA-Z][\w.-]*)((?:\s+[^\s"'=<>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*>/;

/**
 * Matches a single attribute, capturing its name and value.
 *
 * @type {RegExp}
 */
const REGEXP_ATTRIBUTE =
	/([^\s"'=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

/**
 * Returns the name of the element wrapping the whole string, or `null` if the
 * string is not wrapped in a single element, or if moving the element out of
 * the string could lose something translators need.
 *
 * @param {string} string Translatable string.
 *
 * @return {?string} Name of the wrapping element.
 */
function getWrappingTagName( string ) {
	const openingTag = string.match( REGEXP_OPENING_TAG );

	if ( ! openingTag ) {
		return null;
	}

	const [ fullOpeningTag, tagName, attributes ] = openingTag;

	for ( const [ , name, ...values ] of attributes.matchAll(
		REGEXP_ATTRIBUTE
	) ) {
		const value = values.find( ( v ) => v !== undefined ) ?? '';

		// Placeholders in attributes, as in `<option value="%s">`, need
		// translators to see the element.
		if ( getSprintfPlaceholders( value ).length ) {
			return null;
		}

		// The link target may need to be localized.
		if ( tagName.toLowerCase() === 'a' && name.toLowerCase() === 'href' ) {
			return null;
		}
	}

	// Find the closing tag that matches the opening tag, allowing for nested
	// elements with the same name.
	const escapedTagName = tagName.replace( /[.-]/g, '\\$&' );
	const tagPattern = new RegExp(
		`<(/?)${ escapedTagName }(?=[\\s/>])[^>]*?(/?)>`,
		'g'
	);
	tagPattern.lastIndex = fullOpeningTag.length;

	let depth = 1;
	let match;
	while ( ( match = tagPattern.exec( string ) ) !== null ) {
		const [ tag, isClosing, isSelfClosing ] = match;

		if ( isSelfClosing ) {
			continue;
		}

		depth += isClosing ? -1 : 1;

		if ( depth === 0 ) {
			return match.index + tag.length === string.length ? tagName : null;
		}
	}

	return null;
}

module.exports = {
	meta: {
		type: 'suggestion',
		schema: [],
		messages: {
			htmlWrapped:
				'Translatable strings should not be wrapped in HTML. Move the <{{ tagName }}> element outside of the translatable string.',
		},
	},
	create( context ) {
		return {
			CallExpression( node ) {
				const { callee, arguments: args } = node;

				const functionName = getTranslateFunctionName( callee );

				if ( ! TRANSLATION_FUNCTIONS.has( functionName ) ) {
					return;
				}

				const candidates = getTranslateFunctionArgs(
					functionName,
					args,
					false
				);

				for ( const candidate of candidates ) {
					if ( ! candidate ) {
						continue;
					}

					const string = getTextContentFromNode( candidate );

					if ( typeof string !== 'string' ) {
						continue;
					}

					const tagName = getWrappingTagName( string );

					if ( tagName ) {
						context.report( {
							node: candidate,
							messageId: 'htmlWrapped',
							data: { tagName },
						} );
					}
				}
			},
		};
	},
};
