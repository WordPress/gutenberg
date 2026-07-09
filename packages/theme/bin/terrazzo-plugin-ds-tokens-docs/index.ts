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
	{
		title: 'Surface',
		tokenIds: [
			/^wpds-color\.(background|stroke)\.surface\./,
			/^wpds-dimension\.surface-width\./,
		],
	},
	{
		title: 'Interactive',
		tokenIds: [
			/^wpds-color\.(background|foreground|stroke)\.interactive\./,
		],
	},
	{ title: 'Content', tokenIds: [ /^wpds-color\.foreground\.content\./ ] },
	{ title: 'Track', tokenIds: [ /^wpds-color\.background\.track\./ ] },
	{ title: 'Thumb', tokenIds: [ /^wpds-color\.background\.thumb\./ ] },
	{
		title: 'Focus indicators',
		tokenIds: [
			/^wpds-border\.width\.focus$/,
			/^wpds-color\.stroke\.focus$/,
		],
	},
	{ title: 'Controls', tokenIds: [ /^wpds-cursor\.control$/ ] },
	{
		title: 'Spacing',
		tokenIds: [ /^wpds-dimension\.(padding|gap)\./ ],
	},
	{ title: 'Element sizes', tokenIds: [ /^wpds-dimension\.size\./ ] },
	{
		title: 'Borders',
		tokenIds: [
			/^wpds-border\.radius\./,
			/^wpds-border\.width\.(?!focus$)/,
		],
	},
	{ title: 'Elevations', tokenIds: [ /^wpds-elevation\./ ] },
	{
		title: 'Motion',
		tokenIds: [ /^wpds-motion\.(duration|easing)\./ ],
	},
	{
		title: 'Typography',
		tokenIds: [
			/^wpds-typography\.font-family\./,
			/^wpds-typography\.font-size\./,
			/^wpds-typography\.font-weight\./,
			/^wpds-typography\.line-height\./,
		],
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

			const semanticTokensByGroup: TokensMap = Object.fromEntries(
				ROLE_GROUPS.map( ( { title } ) => [ title, {} ] )
			);
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
				semanticTokensByGroup[ roleGroup ][ token.localID ] =
					token.token.$description ?? 'N/A';
			}

			function tokensToMdTable( tokens: TokensMap ) {
				return ROLE_GROUPS.flatMap( ( { title } ) => {
					const tokensInGroup = tokens[ title ];

					if ( Object.keys( tokensInGroup ).length === 0 ) {
						return [];
					}

					return [
						`### ${ title }`,
						'',
						'| Variable name | Description |',
						'|---|---|',
						...Object.entries( tokensInGroup ).map(
							( [ name, description ] ) =>
								`| \`${ name }\` | ${ description } |`
						),
						'',
					];
				} );
			}

			const generatedTokenTables = [
				GENERATED_SECTION_START,
				'',
				'## Semantic tokens',
				'',
				'These generated tables list every public semantic token, grouped by the element or token family encoded in each token name. Use them to compare related tokens for the same kind of UI element.',
				'',
				...tokensToMdTable( semanticTokensByGroup ),
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
