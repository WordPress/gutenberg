/**
 * External dependencies
 */
import docgen from 'react-docgen-typescript';
import glob from 'glob';
import fs from 'node:fs/promises';
import path from 'path';

/**
 * Internal dependencies
 */
import { generateMarkdownDocs } from './markdown/index.mjs';

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

	const typeDocs = docgen
		.parse( resolvedPath, OPTIONS )
		.find( ( obj ) => obj.displayName === displayName );

	if ( typeof typeDocs === 'undefined' ) {
		throw new Error(
			`react-docgen-typescript could not generate type docs for ${ displayName } in ${ resolvedPath }`
		);
	}

	return typeDocs;
}

const manifests = glob.sync( 'packages/components/src/**/docs-manifest.json' );

await Promise.all(
	manifests.map( async ( manifestPath ) => {
		const manifest = JSON.parse(
			await fs.readFile( manifestPath, 'utf8' )
		);

		const typeDocs = getTypeDocsForComponent( {
			manifestPath,
			componentFilePath: manifest.filePath,
			displayName: manifest.displayName,
		} );

		const subcomponentTypeDocs = ! manifest.subcomponents
			? undefined
			: await Promise.all(
					manifest.subcomponents.map( async ( subcomponent ) => {
						const docs = getTypeDocsForComponent( {
							manifestPath,
							componentFilePath: subcomponent.filePath,
							displayName: subcomponent.displayName,
						} );

						if ( subcomponent.preferredDisplayName ) {
							docs.displayName =
								subcomponent.preferredDisplayName;
						}

						return docs;
					} )
			  );

		const docs = generateMarkdownDocs( { typeDocs, subcomponentTypeDocs } );
		const outputFile = path.resolve(
			path.dirname( manifestPath ),
			'./README.md'
		);

		return fs.writeFile( outputFile, docs );
	} )
);
