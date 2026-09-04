import { readFile } from 'node:fs/promises';
import type { Node } from '@babel/types';
import { loadCsf } from 'storybook/internal/csf-tools';
import type { Indexer } from 'storybook/internal/types';

/**
 * Reads `parameters.componentStatus.status` out of a story file's meta.
 *
 * Parameters never reach the story index, so the sidebar cannot see the
 * status a docs page shows. Reading the value from the source at index time
 * keeps the stories untouched.
 *
 * @param parameters The AST node of the meta's `parameters` property.
 * @return The status string, or `undefined` when there is none.
 */
function readComponentStatus( parameters?: Node ): string | undefined {
	const componentStatus = getProperty( parameters, 'componentStatus' );
	const status = getProperty( componentStatus, 'status' );
	return status?.type === 'StringLiteral' ? status.value : undefined;
}

function getProperty( node: Node | undefined, name: string ): Node | undefined {
	if ( node?.type !== 'ObjectExpression' ) {
		return undefined;
	}
	for ( const property of node.properties ) {
		if (
			property.type === 'ObjectProperty' &&
			property.key.type === 'Identifier' &&
			property.key.name === name
		) {
			return property.value;
		}
	}
	return undefined;
}

/**
 * Indexes CSF files like Storybook's own indexer, and additionally tags every
 * entry with `status-<componentStatus>` so the sidebar and its tag filter can
 * show the recommendation status declared in `parameters.componentStatus`.
 */
export const statusIndexer: Indexer = {
	test: /\.story\.(m?js|ts)x?$/,
	async createIndex( fileName, options ) {
		const code = await readFile( fileName, 'utf8' );
		if ( code.trim().length === 0 ) {
			return [];
		}

		const csf = loadCsf( code, { ...options, fileName } ).parse();
		const status = readComponentStatus( csf._metaAnnotations.parameters );
		if ( ! status ) {
			return csf.indexInputs;
		}

		const tag = `status-${ status }`;
		return csf.indexInputs.map( ( input ) => ( {
			...input,
			tags: [ ...( input.tags ?? [] ), tag ],
		} ) );
	},
};
