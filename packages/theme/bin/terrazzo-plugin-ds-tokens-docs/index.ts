import { readFileSync } from 'node:fs';

import { FORMAT_ID } from '@terrazzo/plugin-css';
import type { Plugin } from '@terrazzo/parser';

const GENERATED_SECTION_START =
	'<!-- START GENERATED TOKEN TABLES: Do not edit this section directly. -->';
const GENERATED_SECTION_END = '<!-- END GENERATED TOKEN TABLES -->';

function escapeRegExp( str: string ) {
	return str.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
}

function titleCase( str: string ) {
	return str[ 0 ].toUpperCase() + str.slice( 1 );
}

type TokensMap = Record< string, Record< string, string > >;

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

			const semanticTokens: TokensMap = {};
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

				// Use the tokens filename (without .json) as the group name
				const group =
					token.token.source.loc
						?.split( '/' )
						.at( -1 )
						?.split( '.json' )[ 0 ] ?? 'Miscellaneous';

				// Group by category
				semanticTokens[ group ] ??= {};
				semanticTokens[ group ][ token.localID ] =
					token.token.$description ?? 'N/A';
			}

			function tokensToMdTable( tokens: TokensMap ) {
				return Object.entries( tokens )
					.map( ( [ group, tokensInGroup ] ) => [
						`### ${ titleCase( group ) }`,
						'',
						'| Variable name | Description |',
						'|---|---|',
						...Object.entries( tokensInGroup ).map(
							( [ name, description ] ) =>
								`| \`${ name }\` | ${ description } |`
						),
						'',
					] )
					.flat( 2 );
			}

			const generatedTokenTables = [
				GENERATED_SECTION_START,
				'',
				'## Semantic tokens',
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
