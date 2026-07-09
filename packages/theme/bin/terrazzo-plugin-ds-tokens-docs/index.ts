import { readFileSync } from 'node:fs';

import { FORMAT_ID } from '@terrazzo/plugin-css';
import type { Plugin } from '@terrazzo/parser';

const GENERATED_SECTION_START =
	'<!-- START GENERATED TOKEN TABLES: Do not edit this section directly. -->';
const GENERATED_SECTION_END = '<!-- END GENERATED TOKEN TABLES -->';

function escapeRegExp( str: string ) {
	return str.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
}

type TokenReference = {
	name: string;
	description: string;
};

export default function pluginDsTokenDocs( {
	filename = 'design-tokens.md',
	sourceFilename = '../../docs/tokens.md',
} = {} ): Plugin {
	return {
		name: '@terrazzo/terrazzo-plugin-ds-tokens-docs',
		async build( { getTransforms, outputFile } ) {
			if ( ! filename ) {
				return;
			}

			const semanticTokens: TokenReference[] = [];
			// Re-use transformed tokens from the CSS plugin
			for ( const token of getTransforms( {
				format: FORMAT_ID,
				id: '*',
				mode: '.',
			} ) ) {
				if ( token.localID === undefined ) {
					console.warn(
						'Unexpected — Missing local ID when building token list for eslint plugin'
					);
					continue;
				}

				semanticTokens.push( {
					name: token.localID,
					description: token.token.$description ?? 'N/A',
				} );
			}

			function tokensToMdTable( tokens: TokenReference[] ) {
				return [
					'| Variable name | Description |',
					'|---|---|',
					...tokens
						.toSorted( ( a, b ) => a.name.localeCompare( b.name ) )
						.map(
							( { name, description } ) =>
								`| \`${ name }\` | ${ description } |`
						),
				];
			}

			const generatedTokenTables = [
				GENERATED_SECTION_START,
				'',
				'## Semantic tokens',
				'',
				'This generated table lists every public semantic token, sorted by CSS custom property name so related tokens appear together.',
				'',
				...tokensToMdTable( semanticTokens ),
				GENERATED_SECTION_END,
			].join( '\n' );

			const template = readFileSync(
				new URL( sourceFilename, import.meta.url ),
				'utf8'
			);
			const generatedSectionPattern = new RegExp(
				`${ escapeRegExp(
					GENERATED_SECTION_START
				) }[\\s\\S]*${ escapeRegExp( GENERATED_SECTION_END ) }`
			);

			if ( ! generatedSectionPattern.test( template ) ) {
				throw new Error(
					`@terrazzo/terrazzo-plugin-ds-tokens-docs: Missing generated token section markers in ${ sourceFilename }.`
				);
			}

			outputFile(
				filename,
				template
					.replace( generatedSectionPattern, generatedTokenTables )
					.trimEnd() + '\n'
			);
		},
	};
}
