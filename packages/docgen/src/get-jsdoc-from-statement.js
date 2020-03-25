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

const getType = ( typeExpression ) =>
	typeExpression ? typeToString( typeExpression.type ) : 'undocumented';

/**
 * It loops back from the description until ] is found and extract default value from it.
 * This function assumes that the name of param tag always ends with ].
 *
 * @param {string} code
 * @param {number} nameEndPos
 * @param {number} descriptionPos
 */
const getDefaultValue = ( code, nameEndPos, descriptionPos ) => {
	let closingBracketPos = descriptionPos;

	for ( let i = descriptionPos - 1; i > nameEndPos; i-- ) {
		if ( code[ i ] === ']' ) {
			closingBracketPos = i;
			break;
		}
	}

	const rawValue = code.substring( nameEndPos + 1, closingBracketPos );

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

const getTypeNameAndDefaultValue = ( tag, code, description ) => {
	const typeName = getType( tag.typeExpression );
	const result = {};

	if ( tag.isBracketed ) {
		if ( code[ tag.name.end ] === '=' ) {
			result.type = typeName;
			result.defaultValue = getDefaultValue(
				code,
				tag.name.end,
				code.indexOf( description, tag.name.end )
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

	return result;
};

const getJSDocTypeLiteralProperties = ( code, jsDocPropertyTags ) => {
	return jsDocPropertyTags.map( ( p ) => {
		const result = {
			name:
				p.name.kind === SyntaxKind.QualifiedName
					? `${ p.name.left.escapedText }.${ p.name.right.escapedText }`
					: `${ p.name.escapedText }`,
			description: p.comment ? p.comment : null,
		};

		const {
			type: typeName,
			defaultValue: value,
		} = getTypeNameAndDefaultValue( p, code, result.description );

		result.type = typeName;

		if ( value !== undefined ) {
			result.defaultValue = value;
		}

		return result;
	} );
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
		const code = statement.parent.text;
		const lastComment = statement.jsDoc[ statement.jsDoc.length - 1 ];

		return {
			description: lastComment.comment,
			tags: ( lastComment.tags || [] ).map( ( tag ) => {
				const title = tag.tagName.escapedText;
				const description = tag.comment ? tag.comment : null;

				if ( tag.kind === SyntaxKind.JSDocParameterTag ) {
					const result = {
						title,
						description,
					};
					const { type, defaultValue } = getTypeNameAndDefaultValue(
						tag,
						code,
						description
					);

					result.type = type;
					result.name = tag.name.escapedText;

					if ( defaultValue !== undefined ) {
						result.defaultValue = defaultValue;
					}

					if (
						tag.typeExpression &&
						tag.typeExpression.type.kind ===
							SyntaxKind.JSDocTypeLiteral
					) {
						result.properties = getJSDocTypeLiteralProperties(
							code,
							tag.typeExpression.type.jsDocPropertyTags
						);
					}

					return result;
				}

				if ( tag.kind === SyntaxKind.JSDocTypedefTag ) {
					const result = {
						title,
						name: tag.name.escapedText,
						description,
					};

					const properties = getJSDocTypeLiteralProperties(
						code,
						tag.typeExpression.jsDocPropertyTags
					);

					if ( properties !== null ) {
						result.properties = properties;
					}

					return result;
				}

				if (
					tag.kind === SyntaxKind.JSDocReturnTag ||
					tag.kind === SyntaxKind.JSDocTypeTag
				) {
					return {
						title,
						description,
						type: getType( tag.typeExpression ),
					};
				}

				if ( title === 'example' ) {
					return {
						title,
						// restore @wordpress changed in compile.js
						description: description.replace(
							/__WORDPRESS_IMPORT__/g,
							'@wordpress'
						),
					};
				}

				return {
					title,
					description,
				};
			} ),
		};
	}

	return null;
};
