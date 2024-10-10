/**
 * External dependencies
 */
const docgen = require( 'react-docgen-typescript' );
const glob = require( 'glob' );
const fs = require( 'fs' );
const path = require( 'path' );

/**
 * Internal dependencies
 */
const { generateMarkdownDocs } = require( './markdown' );

// For consistency, options should generally match the options used in Storybook.
const OPTIONS = {
	shouldExtractLiteralValuesFromEnum: true,
	shouldRemoveUndefinedFromOptional: true,
	propFilter: ( prop ) =>
		prop.parent ? ! /node_modules/.test( prop.parent.fileName ) : true,
	savePropValueAsString: true,
};

function getTypeDocsForComponent( {
	manifestPath,
	componentFilePath,
	displayName,
} ) {
	const resolvedPath = path.resolve(
		path.dirname( manifestPath ),
		componentFilePath
	);

	return docgen
		.parse( resolvedPath, OPTIONS )
		.find( ( obj ) => obj.displayName === displayName );
}

const manifests = glob.sync( 'packages/components/src/**/docs-manifest.json' );

manifests.forEach( ( manifestPath ) => {
	const manifest = JSON.parse( fs.readFileSync( manifestPath, 'utf8' ) );

	const typeDocs = getTypeDocsForComponent( {
		manifestPath,
		componentFilePath: manifest.filePath,
		displayName: manifest.displayName,
	} );

	const subcomponentTypeDocs = manifest.subcomponents?.map(
		( subcomponent ) => {
			const docs = getTypeDocsForComponent( {
				manifestPath,
				componentFilePath: subcomponent.filePath,
				displayName: subcomponent.displayName,
			} );

			if ( subcomponent.preferredDisplayName ) {
				docs.displayName = subcomponent.preferredDisplayName;
			}

			return docs;
		}
	);

	const docs = generateMarkdownDocs( { typeDocs, subcomponentTypeDocs } );
	const outputFile = path.resolve(
		path.dirname( manifestPath ),
		'./README.md'
	);

	fs.writeFileSync( outputFile, docs );
} );
