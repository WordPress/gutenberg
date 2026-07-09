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

type RoleGroup = {
	id: string;
	title: string;
	tokenIds?: readonly RegExp[];
	children?: readonly RoleGroup[];
};

type LeafRoleGroup = {
	id: string;
	title: string;
	tokenIds: readonly RegExp[];
	path: readonly string[];
};

const ROLE_GROUPS = [
	{
		id: 'color',
		title: 'Color',
		children: [
			{
				id: 'color-background',
				title: 'Background',
				children: [
					{
						id: 'color-background-surface',
						title: 'Surface',
						tokenIds: [ /^wpds-color\.background\.surface\./ ],
					},
					{
						id: 'color-background-interactive',
						title: 'Interactive',
						tokenIds: [ /^wpds-color\.background\.interactive\./ ],
					},
					{
						id: 'color-background-track',
						title: 'Track',
						tokenIds: [ /^wpds-color\.background\.track\./ ],
					},
					{
						id: 'color-background-thumb',
						title: 'Thumb',
						tokenIds: [ /^wpds-color\.background\.thumb\./ ],
					},
				],
			},
			{
				id: 'color-foreground',
				title: 'Foreground',
				children: [
					{
						id: 'color-foreground-content',
						title: 'Content',
						tokenIds: [ /^wpds-color\.foreground\.content\./ ],
					},
					{
						id: 'color-foreground-interactive',
						title: 'Interactive',
						tokenIds: [ /^wpds-color\.foreground\.interactive\./ ],
					},
				],
			},
			{
				id: 'color-stroke',
				title: 'Stroke',
				children: [
					{
						id: 'color-stroke-surface',
						title: 'Surface',
						tokenIds: [ /^wpds-color\.stroke\.surface\./ ],
					},
					{
						id: 'color-stroke-interactive',
						title: 'Interactive',
						tokenIds: [ /^wpds-color\.stroke\.interactive\./ ],
					},
					{
						id: 'color-stroke-focus',
						title: 'Focus',
						tokenIds: [ /^wpds-color\.stroke\.focus$/ ],
					},
				],
			},
		],
	},
	{
		id: 'dimension',
		title: 'Dimension',
		children: [
			{
				id: 'dimension-padding',
				title: 'Padding',
				tokenIds: [ /^wpds-dimension\.padding\./ ],
			},
			{
				id: 'dimension-gap',
				title: 'Gap',
				tokenIds: [ /^wpds-dimension\.gap\./ ],
			},
			{
				id: 'dimension-size',
				title: 'Size (element size)',
				tokenIds: [ /^wpds-dimension\.size\./ ],
			},
			{
				id: 'dimension-surface-width',
				title: 'Surface width',
				tokenIds: [ /^wpds-dimension\.surface-width\./ ],
			},
		],
	},
	{
		id: 'border',
		title: 'Border',
		children: [
			{
				id: 'border-width',
				title: 'Width',
				tokenIds: [ /^wpds-border\.width\./ ],
			},
			{
				id: 'border-radius',
				title: 'Radius',
				tokenIds: [ /^wpds-border\.radius\./ ],
			},
		],
	},
	{
		id: 'cursor',
		title: 'Cursor',
		tokenIds: [ /^wpds-cursor\./ ],
	},
	{
		id: 'elevation',
		title: 'Elevation',
		tokenIds: [ /^wpds-elevation\./ ],
	},
	{
		id: 'motion',
		title: 'Motion',
		children: [
			{
				id: 'motion-duration',
				title: 'Duration',
				tokenIds: [ /^wpds-motion\.duration\./ ],
			},
			{
				id: 'motion-easing',
				title: 'Easing',
				tokenIds: [ /^wpds-motion\.easing\./ ],
			},
		],
	},
	{
		id: 'typography',
		title: 'Typography',
		children: [
			{
				id: 'typography-font-family',
				title: 'Font family',
				tokenIds: [ /^wpds-typography\.font-family\./ ],
			},
			{
				id: 'typography-font-size',
				title: 'Font size',
				tokenIds: [ /^wpds-typography\.font-size\./ ],
			},
			{
				id: 'typography-line-height',
				title: 'Line height',
				tokenIds: [ /^wpds-typography\.line-height\./ ],
			},
			{
				id: 'typography-font-weight',
				title: 'Font weight',
				tokenIds: [ /^wpds-typography\.font-weight\./ ],
			},
		],
	},
] satisfies readonly RoleGroup[];

function getLeafGroups(
	groups: readonly RoleGroup[] = ROLE_GROUPS,
	path: readonly string[] = []
): LeafRoleGroup[] {
	return groups.flatMap( ( group ) => {
		const groupPath = [ ...path, group.title ];

		if ( group.children ) {
			return getLeafGroups( group.children, groupPath );
		}

		if ( ! group.tokenIds ) {
			throw new Error(
				`@terrazzo/terrazzo-plugin-ds-tokens-docs: Token reference section ${ groupPath.join(
					' > '
				) } must define either children or tokenIds.`
			);
		}

		return [
			{
				id: group.id,
				title: group.title,
				tokenIds: group.tokenIds,
				path: groupPath,
			},
		];
	} );
}

const LEAF_GROUPS = getLeafGroups();

function getRoleGroup( tokenId: string ) {
	const matchingGroups = LEAF_GROUPS.filter( ( { tokenIds } ) =>
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
				.map( ( { path } ) => path.join( ' > ' ) )
				.join( ', ' ) }.`
		);
	}

	return matchingGroups[ 0 ].id;
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
				LEAF_GROUPS.map( ( { id } ) => [ id, {} ] )
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

			function tokensToMdSections(
				groups: readonly RoleGroup[],
				tokens: TokensMap,
				headingLevel = 3
			): string[] {
				return groups.flatMap( ( group ) => {
					const heading = `${ '#'.repeat( headingLevel ) } ${
						group.title
					}`;

					if ( group.children ) {
						return [
							heading,
							'',
							...tokensToMdSections(
								group.children,
								tokens,
								headingLevel + 1
							),
						];
					}

					const tokensInGroup = tokens[ group.id ];

					if ( Object.keys( tokensInGroup ).length === 0 ) {
						return [];
					}

					return [
						heading,
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
				'<!-- markdownlint-disable MD024 -->',
				'',
				'## Semantic tokens',
				'',
				'These generated tables list every public semantic token, grouped by the token family and role segments encoded in each token name.',
				'',
				...tokensToMdSections( ROLE_GROUPS, semanticTokensByGroup ),
				'<!-- markdownlint-enable MD024 -->',
				'',
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
