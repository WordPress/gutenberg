/**
 * External dependencies
 */
const { createMacro } = require( 'babel-plugin-macros' );
const { existsSync, readFileSync } = require( 'fs' );
const { mapKeys, pick } = require( 'lodash' );
const { dirname, join, relative } = require( 'path' );

const i18nVariable = '_x';
const aliases = {
	styleVariations: 'styles',
};
const whitelistedProperties = [
	'name',
	'title',
	'category',
	'parent',
	'icon',
	'description',
	'keywords',
	'attributes',
	'styles',
];
const translatableProperties = [
	'title',
	'description',
	'keywords',
	'styles',
];

function getFilename( [ filenamePath ], state ) {
	const filename = filenamePath.evaluate().value;

	return join(
		relative( process.cwd(), dirname( state.file.opts.filename ) ),
		filename
	);
}

function readMetadata( filename ) {
	if ( ! existsSync( filename ) ) {
		throw new Error( `Invalid file name provided: ${ filename }.` );
	}

	const metadataRaw = readFileSync( filename, 'utf8' );

	return JSON.parse( metadataRaw );
}

function formatMetadata( metadata, types ) {
	const replaceWithAlias = ( _, key ) => {
		return aliases[ key ] || key;
	};
	const metadataFiltered = pick(
		mapKeys( metadata, replaceWithAlias ),
		whitelistedProperties
	);
	return types.valueToNode( metadataFiltered );
}

function wrapTranslatableProperty( node, name, textDomain, types ) {
	if ( node.type === 'StringLiteral' && node.value ) {
		node = types.callExpression(
			types.identifier( i18nVariable ),
			[
				node,
				types.stringLiteral( `block ${ name }` ),
				textDomain !== 'default' && types.stringLiteral( textDomain ),
			].filter( Boolean )
		);
	} else if ( node.type === 'ArrayExpression' ) {
		node.elements = node.elements.map(
			( elementNode ) => wrapTranslatableProperty(
				elementNode,
				name,
				textDomain,
				types
			)
		);
	} else if ( node.type === 'ObjectExpression' ) {
		node.properties.forEach( ( propertyNode ) => {
			if ( propertyNode.key.name === 'label' ) {
				propertyNode.value = wrapTranslatableProperty(
					propertyNode.value,
					name,
					textDomain,
					types
				);
			}
		} );
	}
	return node;
}

function babelBlockMacro( { references, state, babel } ) {
	const { types } = babel;
	references.default.forEach( ( referencePath ) => {
		if ( referencePath.parentPath.type === 'CallExpression' ) {
			const { textDomain, ...metadata } = readMetadata(
				getFilename( referencePath.parentPath.get( 'arguments' ), state )
			);

			referencePath.parentPath.replaceWith( formatMetadata( metadata, types ) );
			if ( textDomain ) {
				referencePath.parentPath.node.properties.forEach( ( propertyPath ) => {
					if ( translatableProperties.includes( propertyPath.key.name ) ) {
						if ( ! state.hasTranslationImportDeclaration ) {
							if ( ! referencePath.scope.hasBinding( i18nVariable ) ) {
								const importDeclaration = types.importDeclaration(
									[
										types.importSpecifier(
											types.identifier( i18nVariable ),
											types.identifier( i18nVariable )
										),
									],
									types.stringLiteral( '@wordpress/i18n' )
								);
								referencePath.scope.getProgramParent().path
									.unshiftContainer( 'body', importDeclaration );
							}
							state.hasTranslationImportDeclaration = true;
						}
						propertyPath.value = wrapTranslatableProperty(
							propertyPath.value,
							propertyPath.key.name,
							textDomain,
							types
						);
					}
				} );
			}
		} else {
			throw new Error(
				`@wordpress/babel-plugin-block/macro only be used as function call. You tried ${ referencePath.parentPath.type }.`,
			);
		}
	} );
}

module.exports = createMacro( babelBlockMacro );
