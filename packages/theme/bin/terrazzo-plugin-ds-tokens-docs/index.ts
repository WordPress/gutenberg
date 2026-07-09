import { readFileSync } from 'node:fs';

import { FORMAT_ID } from '@terrazzo/plugin-css';
import type { Plugin } from '@terrazzo/parser';

const GENERATED_SECTION_START =
	'<!-- START GENERATED TOKEN TABLES: Do not edit this section directly. -->';
const GENERATED_SECTION_END = '<!-- END GENERATED TOKEN TABLES -->';

function escapeRegExp( str: string ) {
	return str.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
}

type TokensMap = Record< string, Record< string, string > >;

const ROLE_GROUPS = [
	{ title: 'Border radii', tokenIds: [ /^wpds-border\.radius\./ ] },
	{ title: 'Border widths', tokenIds: [ /^wpds-border\.width\.(?!focus$)/ ] },
	{
		title: 'Focus indicators',
		tokenIds: [
			/^wpds-border\.width\.focus$/,
			/^wpds-color\.stroke\.focus$/,
		],
	},
	{
		title: 'Surface backgrounds',
		tokenIds: [ /^wpds-color\.background\.surface\./ ],
	},
	{
		title: 'Interactive backgrounds',
		tokenIds: [ /^wpds-color\.background\.interactive\./ ],
	},
	{
		title: 'Track backgrounds',
		tokenIds: [ /^wpds-color\.background\.track\./ ],
	},
	{
		title: 'Thumb backgrounds',
		tokenIds: [ /^wpds-color\.background\.thumb\./ ],
	},
	{
		title: 'Content foregrounds',
		tokenIds: [ /^wpds-color\.foreground\.content\./ ],
	},
	{
		title: 'Interactive foregrounds',
		tokenIds: [ /^wpds-color\.foreground\.interactive\./ ],
	},
	{
		title: 'Surface strokes',
		tokenIds: [ /^wpds-color\.stroke\.surface\./ ],
	},
	{
		title: 'Interactive strokes',
		tokenIds: [ /^wpds-color\.stroke\.interactive\./ ],
	},
	{ title: 'Control cursor', tokenIds: [ /^wpds-cursor\.control$/ ] },
	{ title: 'Padding', tokenIds: [ /^wpds-dimension\.padding\./ ] },
	{ title: 'Gaps', tokenIds: [ /^wpds-dimension\.gap\./ ] },
	{ title: 'Element sizes', tokenIds: [ /^wpds-dimension\.size\./ ] },
	{
		title: 'Surface widths',
		tokenIds: [ /^wpds-dimension\.surface-width\./ ],
	},
	{ title: 'Elevations', tokenIds: [ /^wpds-elevation\./ ] },
	{ title: 'Animation durations', tokenIds: [ /^wpds-motion\.duration\./ ] },
	{
		title: 'Animation easing curves',
		tokenIds: [ /^wpds-motion\.easing\./ ],
	},
	{
		title: 'Font families',
		tokenIds: [ /^wpds-typography\.font-family\./ ],
	},
	{ title: 'Font sizes', tokenIds: [ /^wpds-typography\.font-size\./ ] },
	{ title: 'Line heights', tokenIds: [ /^wpds-typography\.line-height\./ ] },
	{
		title: 'Font weights',
		tokenIds: [ /^wpds-typography\.font-weight\./ ],
	},
] as const;

function getRoleGroup( tokenId: string ) {
	const matchingGroups = ROLE_GROUPS.filter( ( { tokenIds } ) =>
		tokenIds.some( ( pattern ) => pattern.test( tokenId ) )
	);

	if ( matchingGroups.length === 0 ) {
		throw new Error(
			`@terrazzo/terrazzo-plugin-ds-tokens-docs: No token reference section matches ${ tokenId }. Add it to ROLE_GROUPS.`
		);
	}

	if ( matchingGroups.length > 1 ) {
		throw new Error(
			`@terrazzo/terrazzo-plugin-ds-tokens-docs: Multiple token reference sections match ${ tokenId }: ${ matchingGroups
				.map( ( { title } ) => title )
				.join( ', ' ) }.`
		);
	}

	return matchingGroups[ 0 ].title;
}

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

			const semanticTokensByRole: TokensMap = {};
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

				const roleGroup = getRoleGroup( token.token.id );
				semanticTokensByRole[ roleGroup ] ??= {};
				semanticTokensByRole[ roleGroup ][ token.localID ] =
					token.token.$description ?? 'N/A';
			}

			function tokensToMdTable( tokens: TokensMap ) {
				return Object.entries( tokens )
					.map( ( [ group, tokensInGroup ] ) => [
						`### ${ group }`,
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
				'These generated tables list every public semantic token, grouped by the purpose encoded in each token name. Use them to compare related tokens for the same kind of UI element or CSS property.',
				'',
				...tokensToMdTable( semanticTokensByRole ),
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
