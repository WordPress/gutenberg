import fs from 'node:fs/promises';
import { parse } from '@babel/parser';

/**
 * Returns `meta.tags` from a Storybook file.
 *
 * @param {string} filePath
 * @return {Promise<string[]>} Array of tags.
 */
export async function getTagsFromStorybook( filePath ) {
	const fileContent = await fs.readFile( filePath, 'utf8' );
	const parsedFile = parse( fileContent, {
		sourceType: 'module',
		plugins: [ 'jsx', 'typescript' ],
	} );

	const meta = parsedFile.program.body.find(
		( node ) =>
			node.type === 'VariableDeclaration' &&
			node.declarations[ 0 ].id.name === 'meta'
	);

	return (
		meta.declarations[ 0 ].init.properties
			.find( ( node ) => node.key.name === 'tags' )
			?.value.elements.map( ( node ) => node.value ) ?? []
	);
}
