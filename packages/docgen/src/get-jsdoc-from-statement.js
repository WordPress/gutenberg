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

const getType = ( typeExpression ) =>
	typeExpression ? typeToString( typeExpression.type ) : 'undocumented';

const getTypeNameAndDefaultValue = ( tag, code, description ) => {
	const typeName = getType( tag.typeExpression );
	const result = {};

	if ( tag.isBracketed ) {
		if ( code[ tag.name.end ] === '=' ) {
			result.type = typeName;
			result.defaultValue = getDefaultValue(
				tag.name,
				code,
				description
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
						const properties =
							tag.typeExpression.type.jsDocPropertyTags;
						result.properties = properties.map( ( p ) => {
							const propResult = {
								name: `${ p.name.left.escapedText }.${ p.name.right.escapedText }`,
								description: p.comment ? p.comment : null,
							};

							const {
								type: typeName,
								defaultValue: value,
							} = getTypeNameAndDefaultValue(
								p,
								code,
								propResult.description
							);

							propResult.type = typeName;

							if ( value !== undefined ) {
								propResult.defaultValue = value;
							}

							return propResult;
						} );
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
