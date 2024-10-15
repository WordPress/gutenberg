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

const MANIFEST_GLOB = 'packages/components/src/**/docs-manifest.json';

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

	const typeDocs = docgen.parse( resolvedPath, OPTIONS );

	if ( typeDocs.length === 0 ) {
		throw new Error(
			`react-docgen-typescript could not generate any type docs from ${ resolvedPath }`
		);
	}

	const matchingTypeDoc = typeDocs.find(
		( obj ) => obj.displayName === displayName
	);

	if ( typeof matchingTypeDoc === 'undefined' ) {
		const unmatchedTypeDocs = typeDocs
			.map( ( obj ) => `\`${ obj.displayName }\`` )
			.join( ', ' );

		throw new Error(
			`react-docgen-typescript could not find type docs for ${ displayName } in ${ resolvedPath }. (Found ${ unmatchedTypeDocs })`
		);
	}

	return matchingTypeDoc;
}

async function parseManifest( manifestPath ) {
	try {
		return JSON.parse( await fs.readFile( manifestPath, 'utf8' ) );
	} catch ( e ) {
		throw new Error(
			`Error parsing docs manifest at ${ manifestPath }: ${ e.message }`
		);
	}
}

const manifests = glob.sync( MANIFEST_GLOB );

await Promise.all(
	manifests.map( async ( manifestPath ) => {
		const manifest = await parseManifest( manifestPath );

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

		try {
			console.log( `Writing docs to ${ outputFile }` );
			return fs.writeFile( outputFile, docs );
		} catch ( e ) {
			throw new Error(
				`Error writing docs to ${ outputFile }: ${ e.message }`
			);
		}
	} )
);
