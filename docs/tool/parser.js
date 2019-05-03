/**
 * Node dependencies
 */
const fs = require( 'fs' );

/**
 * External dependencies
 */
const { last, size, first, some, overEvery, negate, isEmpty } = require( 'lodash' );
const espree = require( 'espree' );
const doctrine = require( 'doctrine' );

/**
 * Returns true if the given Espree parse result node is a documented named
 * export declaration, or false otherwise.
 *
 * @param {Object} node Node to test.
 *
 * @return {boolean} Whether node is a documented named export declaration.
 */
function isDocumentedNamedExport( node ) {
	return (
		node.type === 'ExportNamedDeclaration' &&
		size( node.leadingComments ) > 0
	);
}

/**
 * Returns true if the given exported declaration name is considered stable for
 * documentation, or false otherwise.
 *
 * @see https://github.com/WordPress/gutenberg/blob/master/docs/contributors/coding-guidelines.md#experimental-and-unstable-apis
 *
 * @param {string} name Name to test.
 *
 * @return {boolean} Whether the provided name describes a stable API.
 */
const isStableExportName = ( name ) => ! /^__(unstable|experimental)/.test( name );

/**
 * Returns true if the given export name is eligible to be included in
 * generated output, or false otherwise.
 *
 * @type {boolean} Whether name is eligible for documenting.
 */
const isEligibleExportedName = overEvery( [
	negate( isEmpty ),
	isStableExportName,
] );

/**
 * Returns the assigned name for a given declaration node type, or undefined if
 * it cannot be determined.
 *
 * @param {Object} declaration Declaration node.
 *
 * @return {?string} Exported declaration name.
 */
function getDeclarationExportedName( declaration ) {
	let declarator;
	switch ( declaration.type ) {
		case 'FunctionDeclaration':
			declarator = declaration;
			break;

		case 'VariableDeclaration':
			declarator = first( declaration.declarations );
	}

	if ( declarator ) {
		return declarator.id.name;
	}
}

/**
 * Returns true if the given DocBlock contains at least one reference to the
 * tag named by the provided title, or false otherwise.
 *
 * @param {Object} docBlock Parsed DocBlock node.
 * @param {string} title    Title to search.
 *
 * @return {boolean} Whether DocBlock contains tag by title.
 */
const hasDocBlockTag = ( docBlock, title ) => some( docBlock.tags, { title } );

/**
 * Returns true if the given DocBlock contains at least one reference to a
 * private tag.
 *
 * @param {Object} docBlock Parsed DocBlock node.
 *
 * @return {boolean} Whether DocBlock contains private tag.
 */
const hasPrivateTag = ( docBlock ) => hasDocBlockTag( docBlock, 'private' );

/**
 * Returns true if the given DocBlock contains at least one reference to a
 * param tag.
 *
 * @param {Object} docBlock Parsed DocBlock node.
 *
 * @return {boolean} Whether DocBlock contains param tag.
 */
const hasParamTag = ( docBlock ) => hasDocBlockTag( docBlock, 'param' );

/**
 * Returns true if the give DocBlock contains a description.
 *
 * @param {Object} docBlock Parsed DocBlock node.
 *
 * @return {boolean} Whether DocBlock contains a description.
 */
const hasDescription = ( docBlock ) => !! docBlock.description;

/**
 * Maps parse type to specific filtering logic by which to consider for
 * inclusion a parsed named export.
 *
 * @type {Object}
 */
const FILTER_PARSED_DOCBLOCK_BY_TYPE = {
	/**
	 * Selectors filter. Excludes documented exports either marked as private
	 * or which do not include at least one `@param` DocBlock tag. This is used
	 * to distinguish between selectors (which at least receive state as an
	 * argument) and exported constant values.
	 *
	 * @param {Object} docBlock DocBlock object to test.
	 *
	 * @return {boolean} Whether documented selector should be included.
	 */
	selectors: overEvery( [ hasParamTag, negate( hasPrivateTag ) ] ),

	/**
	 * Actions filter. Excludes documented exports marked as private.
	 *
	 * @param {Object} docBlock DocBlock object to test.
	 *
	 * @return {boolean} Whether documented action should be included.
	 */
	actions: overEvery( [ hasDescription, negate( hasPrivateTag ) ] ),
};

module.exports = function( config ) {
	const result = {};
	Object.entries( config ).forEach( ( [ namespace, namespaceConfig ] ) => {
		const namespaceResult = {
			name: namespace,
			title: namespaceConfig.title,
			selectors: [],
			actions: [],
		};

		[ 'selectors', 'actions' ].forEach( ( type ) => {
			namespaceConfig[ type ].forEach( ( file ) => {
				const code = fs.readFileSync( file, 'utf8' );
				const parsedCode = espree.parse( code, {
					attachComment: true,
					// This should ideally match our babel config, but espree doesn't support it.
					ecmaVersion: 9,
					sourceType: 'module',
				} );

				parsedCode.body.forEach( ( node ) => {
					if ( ! isDocumentedNamedExport( node ) ) {
						return;
					}

					const docBlock = doctrine.parse(
						last( node.leadingComments ).value,
						{ unwrap: true, recoverable: true }
					);

					const filter = FILTER_PARSED_DOCBLOCK_BY_TYPE[ type ];
					if ( typeof filter === 'function' && ! filter( docBlock ) ) {
						return;
					}

					const name = getDeclarationExportedName( node.declaration );
					if ( ! isEligibleExportedName( name ) ) {
						return;
					}

					const func = {
						name,
						description: docBlock.description,
						deprecated: docBlock.tags.find( ( tag ) => tag.title === 'deprecated' ),
						params: docBlock.tags.filter( ( tag ) => tag.title === 'param' ),
						return: docBlock.tags.find( ( tag ) => tag.title === 'return' ),
					};

					namespaceResult[ type ].push( func );
				} );
			} );
		} );

		result[ namespace ] = namespaceResult;
	} );

	return result;
};
