import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getSkills, resetCache } from '../data';
import { createServer } from '../index';
import { findSkillFile, parseFrontmatter, skillUri } from '../skills';

const TREE_URL =
	'https://api.github.com/repos/WordPress/gutenberg/git/trees/trunk?recursive=1';
const RAW =
	'https://raw.githubusercontent.com/WordPress/gutenberg/refs/heads/trunk/';

const FILES: Record< string, string > = {
	'packages/ui/skills/wp-ui/SKILL.md':
		'---\nname: wp-ui\ndescription: "Use when: building UI."\n---\n\n# wp-ui\n',
	'packages/theme/skills/wp-theme/SKILL.md':
		'---\nname: wp-theme\ndescription: Use when styling.\n---\n\n# wp-theme\n',
	'packages/theme/skills/wp-theme/references/tokens.md': '# Tokens\n',
	'packages/ui/skills/broken/SKILL.md': '---\nname: other\n---\n',
};

const originalFetch = globalThis.fetch;

describe( 'skills', () => {
	beforeEach( () => {
		resetCache();
		globalThis.fetch = vi.fn( ( url: RequestInfo | URL ) => {
			const urlStr = url.toString();
			const body =
				urlStr === TREE_URL
					? {
							tree: [
								...Object.keys( FILES ).map( ( path ) => ( {
									path,
									type: 'blob',
								} ) ),
								{ path: 'packages/ui/skills', type: 'tree' },
								{ path: 'packages/ui/README.md', type: 'blob' },
							],
						}
					: FILES[ urlStr.replace( RAW, '' ) ];
			return Promise.resolve( {
				ok: body !== undefined,
				status: body !== undefined ? 200 : 404,
				statusText: '',
				json: () => Promise.resolve( body ),
				text: () => Promise.resolve( body ),
			} as Response );
		} );
	} );

	afterEach( () => {
		globalThis.fetch = originalFetch;
	} );

	it( 'parses plain and quoted frontmatter values', () => {
		expect(
			parseFrontmatter( FILES[ 'packages/ui/skills/wp-ui/SKILL.md' ] )
		).toEqual( { name: 'wp-ui', description: 'Use when: building UI.' } );
		expect( parseFrontmatter( '# no frontmatter' ) ).toBeNull();
	} );

	it( 'collects skills with all their files and skips invalid ones', async () => {
		const skills = await getSkills();

		expect( skills.map( ( { name } ) => name ) ).toEqual( [
			'wp-theme',
			'wp-ui',
		] );
		expect( skills[ 0 ].files.map( ( { path } ) => path ) ).toEqual( [
			'SKILL.md',
			'references/tokens.md',
		] );
	} );

	it( 'finds a file by its skill URI', async () => {
		const skills = await getSkills();

		expect(
			findSkillFile(
				skills,
				skillUri( 'wp-theme', 'references/tokens.md' )
			)?.file.content
		).toBe( '# Tokens\n' );
		expect(
			findSkillFile( skills, 'skill://wp-theme/nope.md' )
		).toBeNull();
	} );

	describe( 'server', () => {
		it( 'serves skill files with resources/read', async () => {
			const handlers = ( createServer().server as any )
				._requestHandlers as Map< string, any >;
			const result = await handlers.get( 'resources/read' )(
				{
					method: 'resources/read',
					params: { uri: 'skill://wp-theme/references/tokens.md' },
				},
				{}
			);

			expect( result.contents[ 0 ].text ).toBe( '# Tokens\n' );
		} );
	} );
} );
