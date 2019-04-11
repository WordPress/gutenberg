/**
 * Node dependencies
 */
const fs = require( 'fs' );

/**
 * External dependencies
 */
const { last, size, first } = require( 'lodash' );
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
 * Maps parse type to specific filtering logic by which to consider for
 * inclusion a parsed named export.
 *
 * @type {Object}
 */
const FILTER_PARSED_DOCBLOCK_BY_TYPE = {
	/**
	 * Selectors filter. Excludes documented exports which do not include at
	 * least one `@param` DocBlock tag. This is used to distinguish between
	 * selectors (which at least receive state as an argument) and exported
	 * constant values.
	 *
	 * @param {Object} docBlock DocBlock object to test.
	 *
	 * @return {boolean} Whether documented selector should be included.
	 */
	selectors( docBlock ) {
		return !! docBlock.tags.some( ( tag ) => tag.title === 'param' );
	},
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
					if ( ! name ) {
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
