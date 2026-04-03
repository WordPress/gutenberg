/**
 * External dependencies
 */
import fs from 'node:fs/promises';
import babel from '@babel/core';
import { parse as commentParser } from 'comment-parser';

/**
 * Try to get subcomponent descriptions from the main component Object.assign() call.
 * @param {string} filePath
 * @param {string} mainComponentName
 */
export async function getDescriptionsForSubcomponents(
	filePath,
	mainComponentName
) {
	const fileContent = await fs.readFile( filePath, 'utf8' );
	const parsedFile = babel.parse( fileContent, {
		filename: filePath,
	} );
	const mainComponent = parsedFile.program.body
		.filter( ( node ) => node.type === 'ExportNamedDeclaration' )
		.flatMap( ( node ) => node.declaration?.declarations )
		.find( ( node ) => node?.id.name === mainComponentName );

	if (
		! (
			// If the main component export has `Object.assign( ... )`
			(
				mainComponent?.init?.type === 'CallExpression' &&
				mainComponent?.init?.callee?.object?.name === 'Object' &&
				mainComponent?.init?.callee?.property?.name === 'assign'
			)
		)
	) {
		return;
	}

	const properties = mainComponent?.init?.arguments[ 1 ]?.properties.map(
		( node ) => [
			node.key.name,
			commentParser( `/*${ node.leadingComments?.[ 0 ].value }*/`, {
				spacing: 'preserve',
			} )?.[ 0 ]?.description,
		]
	);
	return Object.fromEntries( properties );
}
