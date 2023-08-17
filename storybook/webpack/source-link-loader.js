/**
 * External dependencies
 */
const babel = require( '@babel/core' );
const path = require( 'path' );

const REPO_ROOT = path.resolve( __dirname, '../../' );

/**
 * Adds a `sourceLink` parameter to the story metadata, based on the file path.
 *
 * @see https://storybook.js.org/addons/storybook-source-link
 */
function addSourceLinkPlugin() {
	return {
		visitor: {
			ExportDefaultDeclaration( visitorPath, state ) {
				const componentPath = getComponentPathFromStoryPath(
					state.file.opts.filename
				);
				const properties =
					// When default export is anonymous, the declaration is an object expression
					visitorPath.node.declaration.properties ??
					// When default export is named, the declaration is an identifier, usually the previous node
					visitorPath.getPrevSibling().node.declarations[ 0 ].init
						.properties;

				alterParameters( properties, componentPath );
			},
		},
	};
}

function getComponentPathFromStoryPath( storyPath ) {
	const componentRoot = path.resolve( storyPath, '../../' );
	return path.relative( REPO_ROOT, componentRoot );
}

function alterParameters( properties, componentPath ) {
	const sourceLink = babel.types.objectProperty(
		babel.types.identifier( 'sourceLink' ),
		babel.types.stringLiteral( componentPath )
	);

	let parameters = properties.find( ( op ) => op.key.name === 'parameters' );

	if ( ! parameters ) {
		parameters = babel.types.objectProperty(
			babel.types.identifier( 'parameters' ),
			babel.types.objectExpression( [] )
		);
		properties.push( parameters );
	}

	parameters.value.properties = [
		sourceLink,
		...parameters.value.properties,
	];
}

module.exports = function ( source ) {
	const output = babel.transform( source, {
		plugins: [ addSourceLinkPlugin ],
		filename: this.resourcePath,
		sourceType: 'module',
	} );
	return output.code;
};
