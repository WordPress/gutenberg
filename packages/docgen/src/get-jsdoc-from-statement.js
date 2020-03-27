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
 * It loops from = character until ] is found and extract default value from it.
 * If it starts with a quote(', ", `), it tries to find it.
 * This function assumes that the name of param tag always ends with ].
 *
 * @param {string} code
 * @param {number} nameEndPos
 */
const getDefaultValue = ( code, nameEndPos ) => {
	let closingBracketPos = nameEndPos;

	let startPos = nameEndPos + 1;
	let endingChar = ']';
	const firstChar = code[ startPos ];

	if ( firstChar === `'` || firstChar === '"' || firstChar === '`' ) {
		endingChar = firstChar;
		startPos = nameEndPos + 2;
	}

	if ( firstChar !== '[' ) {
		for ( let i = startPos; ; i++ ) {
			if ( code[ i ] === '\\' && code[ i + 1 ] !== ']' ) {
				continue;
			}

			if (
				code[ i ] === endingChar ||
				code[ i ] === '\n' ||
				code[ i ] === '\r'
			) {
				closingBracketPos = i;
				break;
			}
		}
	} else {
		// count the broken pairs of brackets
		let broken = 0;

		for ( let i = startPos; ; i++ ) {
			if (
				( code[ i ] === ']' && broken === 0 ) ||
				code[ i ] === '\n' ||
				code[ i ] === '\r'
			) {
				closingBracketPos = i;
				break;
			}

			if ( code[ i ] === '[' ) {
				broken++;
			}

			if ( code[ i ] === ']' ) {
				broken--;
			}
		}
	}

	const rawValue = code.substring( startPos, closingBracketPos );

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
					? p.name.right.text
					: p.name.text,
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
 * Restore `@wordpress` changed in compile.js
 *
 * @param {string} description
 */
const restoreWordpressImport = ( description ) =>
	description
		? description.replace( /__WORDPRESS_IMPORT__/g, '@wordpress' )
		: description;

const getTags = ( tags, code ) => {
	const docTags = ( tags || [] ).map( ( tag ) => {
		const title = tag.tagName.text;
		const description = restoreWordpressImport(
			tag.comment ? tag.comment : null
		);

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
			result.name =
				tag.name.kind === SyntaxKind.QualifiedName
					? `${ tag.name.left.text }.${ tag.name.right.text }`
					: tag.name.text;

			if ( defaultValue !== undefined ) {
				result.defaultValue = defaultValue;
			}

			if (
				tag.typeExpression &&
				tag.typeExpression.type.kind === SyntaxKind.JSDocTypeLiteral
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
				name: tag.name.text,
				description,
				type: tag.typeExpression.jsDocPropertyTags
					? 'object'
					: getType( tag.typeExpression ),
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

		return {
			title,
			description,
		};
	} );

	return handleJSDocTypeLiteralsWithTypeOptions( docTags );
};

/**
 * When the type of JSDocTypeLiteral has a type option like {?object} or {object=},
 * typescript cannot parse it correctly and treats properties like seperate parameters.
 *
 * This function handles that case.
 *
 * @param {Array<Object>} docTags
 */
const handleJSDocTypeLiteralsWithTypeOptions = ( docTags ) => {
	let properties = [];
	let removed = [];
	let currentName = '';
	let removedAt = -1;

	// Loops backward to find tag names written in qualified name format i.e. props.value
	for ( let i = docTags.length - 1; i >= 0; i-- ) {
		const tag = docTags[ i ];

		if ( ! tag.name ) continue;

		const names = tag.name.split( '.' );

		// When tag name is written in qualified name format
		if ( names.length > 1 ) {
			// First encounter of the tag name in that style.
			// -> Save it.
			if ( currentName === '' ) {
				currentName = names[ 0 ];
			}

			// Met a qualified name with different first part.
			// -> Reset.
			if ( currentName !== names[ 0 ] ) {
				currentName = names[ 0 ];

				docTags.splice( removedAt, 0, ...removed );
				properties = [];
				removed = [];
				removedAt = -1;
			}

			// Remove tag from the list.
			removedAt = i;
			docTags.splice( i, 1 );
			removed.unshift( tag );
			properties.unshift( {
				name: names[ 1 ],
				type: tag.type,
				description: tag.description,
			} );
		}

		// When we meet a param written in identifier format i.e. name
		// and we have properties to add to it.
		if ( properties.length > 0 && names.length === 1 ) {
			// names match -> add properties.
			if ( tag.name === currentName ) {
				tag.properties = properties;
			}
			// name not match -> restore the removed tags.
			else {
				docTags.splice( removedAt, 0, ...removed );
			}

			// Reset
			properties = [];
			removed = [];
			currentName = '';
			removedAt = -1;
		}
	}

	// when a tag name written in qualfied name format is at the top of the list.
	if ( properties.length > 0 ) {
		docTags.splice( removedAt, 0, ...removed );
	}

	return docTags;
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

		const comment = lastComment.comment ? lastComment.comment : null;
		const description = restoreWordpressImport( comment );
		const tags = getTags( lastComment.tags, code );

		return {
			description,
			tags,
		};
	}

	return null;
};
