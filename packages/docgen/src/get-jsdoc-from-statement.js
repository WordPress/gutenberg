/**
 * External dependencies.
 */
const ts = require( 'typescript' );
const { SyntaxKind } = ts;

const typeToString = require( './type-to-string' );

/**
 * @typedef {import('typescript').Statement} Statement
 */

// from https://stackoverflow.com/questions/9716468/pure-javascript-a-function-like-jquerys-isnumeric
function isNumeric( n ) {
	return ! isNaN( parseFloat( n ) ) && isFinite( n );
}

function stripQuotes( str ) {
	const first = str[ 0 ];
	const last = str[ str.length - 1 ];

	if (
		( first === `'` && last === `'` ) ||
		( first === '"' && last === '"' ) ||
		( first === '`' && last === '`' )
	) {
		return str.substring( 1, str.length - 1 );
	}

	return str;
}

/**
 * It loops back from the description until ] is found and extract default value from it.
 * This function assumes that the name of param tag always ends with ].
 *
 * @param {Object} name
 * @param {string} code
 * @param {string} description
 */
const getDefaultValue = ( name, code, description ) => {
	const descriptionPos = code.indexOf( description, name.end );

	let closingBracketPos = descriptionPos;

	for ( let i = descriptionPos - 1; i > name.end; i-- ) {
		if ( code[ i ] === ']' ) {
			closingBracketPos = i;
			break;
		}
	}

	const rawValue = code.substring( name.end + 1, closingBracketPos );

	if ( isNumeric( rawValue ) ) {
		if ( Number.isInteger( rawValue ) ) {
			return parseInt( rawValue );
		}

		return parseFloat( rawValue );
	}

	if ( rawValue === 'null' ) return null;
	if ( rawValue === 'true' ) return true;
	if ( rawValue === 'false' ) return false;

	if ( rawValue[ 0 ] === '{' && rawValue[ rawValue.length - 1 ] === '}' ) {
	}

	return stripQuotes( rawValue );
};

/**
 * Function that takes a TypeScript statement and returns
 * a object representing the leading JSDoc comment of the statement,
 * if any.
 *
 * @param {Statement} statement TypeScript statement.
 *
 * @return {Object} Object representing the JSDoc comment.
 */
module.exports = function( statement ) {
	if ( statement.jsDoc ) {
		const lastComment = statement.jsDoc[ statement.jsDoc.length - 1 ];

		return {
			description: lastComment.comment,
			tags: ( lastComment.tags || [] ).map( ( tag ) => {
				const getType = () =>
					tag.typeExpression
						? typeToString( tag.typeExpression.type )
						: 'undocumented';
				const result = {
					title: tag.tagName.escapedText,
					description: tag.comment ? tag.comment : null,
				};

				if ( tag.kind === SyntaxKind.JSDocParameterTag ) {
					const typeName = getType();

					if ( tag.isBracketed ) {
						const code = statement.parent.text;

						if ( code[ tag.name.end ] === '=' ) {
							result.type = typeName;
							result.defaultValue = getDefaultValue(
								tag.name,
								code,
								result.description
							);
						} else {
							result.type =
								typeName !== 'undocumented'
									? `${ typeName } | undefined`
									: typeName;
						}
					} else {
						result.type = typeName;
					}

					result.name = tag.name.escapedText;
				}

				if (
					tag.kind === SyntaxKind.JSDocReturnTag ||
					tag.kind === SyntaxKind.JSDocTypeTag
				) {
					result.type = getType();
				}

				if ( result.title === 'example' ) {
					result.description = result.description.replace(
						/__WORDPRESS_IMPORT__/g,
						'@wordpress'
					);
				}

				return result;
			} ),
		};
	}

	return null;
};
