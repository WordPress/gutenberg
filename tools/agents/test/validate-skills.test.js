import { mkdtemp, mkdir, realpath, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import { validateSkill, validateSkills } from '../validate-skills.mjs';

const VALID_SOURCE = `---
name: testing
description: Use when writing tests.
---

# Testing
`;

function messagesFor( source, directoryName = 'testing' ) {
	return validateSkill( { directoryName, source } );
}

describe( 'validateSkill', () => {
	test( 'accepts valid frontmatter', () => {
		expect( messagesFor( VALID_SOURCE ) ).toEqual( [] );
	} );

	test( 'accepts a quoted description that contains ": "', () => {
		const source = `---
name: testing
description: 'Use when writing tests: unit, end-to-end, or PHP.'
---
`;
		expect( messagesFor( source ) ).toEqual( [] );
	} );

	test( 'accepts a description folded over several source lines', () => {
		const source = `---
name: testing
description: >-
  Use when writing
  tests.
---
`;
		expect( messagesFor( source ) ).toEqual( [] );
	} );

	test( 'rejects a file without frontmatter', () => {
		expect( messagesFor( '# Testing\n' ) ).toEqual( [
			{ line: 1, message: expect.stringContaining( 'must start with' ) },
		] );
	} );

	test( 'rejects frontmatter without a closing line', () => {
		expect( messagesFor( '---\nname: testing\n' ) ).toEqual( [
			{ line: 1, message: expect.stringContaining( 'no closing' ) },
		] );
	} );

	test( 'reports an unquoted ": " in a value with its line and a hint', () => {
		const source = `---
name: testing
description: Use when testing: unit or e2e.
---
`;
		expect( messagesFor( source ) ).toEqual( [
			{
				line: 3,
				message: expect.stringMatching(
					/not valid YAML.*wrap the whole value in quotes/
				),
			},
		] );
	} );

	test( 'rejects duplicate fields', () => {
		const source = `---
name: testing
name: testing
description: Use when writing tests.
---
`;
		expect( messagesFor( source ) ).toEqual( [
			{
				line: 3,
				message: expect.stringContaining( 'duplicated mapping key' ),
			},
		] );
	} );

	test( 'rejects frontmatter that is not a set of fields', () => {
		expect( messagesFor( '---\n- testing\n---\n' ) ).toEqual( [
			{ line: 1, message: expect.stringContaining( 'key: value' ) },
		] );
	} );

	test( 'requires name and description', () => {
		expect( messagesFor( '---\nlicense: MIT\n---\n' ) ).toEqual( [
			{
				line: 2,
				message: expect.stringContaining( 'Unknown field "license"' ),
			},
			{ line: 1, message: expect.stringContaining( '"name" field' ) },
			{
				line: 1,
				message: expect.stringContaining( '"description" field' ),
			},
		] );
	} );

	test( 'rejects a name that does not match the directory', () => {
		expect( messagesFor( VALID_SOURCE, 'unit-testing' ) ).toEqual( [
			{
				line: 2,
				message: expect.stringContaining( 'match the skill' ),
			},
		] );
	} );

	test( 'rejects a malformed name', () => {
		const source = VALID_SOURCE.replace(
			'name: testing',
			'name: Unit_Testing'
		);
		expect( messagesFor( source, 'Unit_Testing' ) ).toEqual( [
			{ line: 2, message: expect.stringContaining( 'lowercase' ) },
		] );
	} );

	test( 'rejects a name longer than 64 characters', () => {
		const name = 'a'.repeat( 65 );
		const source = VALID_SOURCE.replace(
			'name: testing',
			`name: ${ name }`
		);
		expect( messagesFor( source, name ) ).toEqual( [
			{ line: 2, message: expect.stringContaining( '64 characters' ) },
		] );
	} );

	test( 'rejects a description with line breaks', () => {
		const source = `---
name: testing
description: |
  Use when writing tests.
  Also for debugging.
---
`;
		expect( messagesFor( source ) ).toEqual( [
			{ line: 3, message: expect.stringContaining( 'single line' ) },
		] );
	} );

	test( 'rejects a description longer than 1024 characters', () => {
		const source = VALID_SOURCE.replace(
			'Use when writing tests.',
			'a'.repeat( 1025 )
		);
		expect( messagesFor( source ) ).toEqual( [
			{
				line: 3,
				message: expect.stringContaining( '1024 characters' ),
			},
		] );
	} );

	test( 'rejects unknown fields', () => {
		const source = VALID_SOURCE.replace(
			'description:',
			'descripton: typo\ndescription:'
		);
		expect( messagesFor( source ) ).toEqual( [
			{
				line: 3,
				message: expect.stringContaining(
					'Unknown field "descripton"'
				),
			},
		] );
	} );
} );

describe( 'validateSkills', () => {
	const temporaryRoots = [];

	afterEach( async () => {
		for ( const root of temporaryRoots.splice( 0 ) ) {
			await rm( root, { recursive: true, force: true } );
		}
	} );

	async function createRepository( files ) {
		const repositoryRoot = await realpath(
			await mkdtemp( path.join( os.tmpdir(), 'gutenberg-skill-lint-' ) )
		);
		temporaryRoots.push( repositoryRoot );
		await mkdir( path.join( repositoryRoot, '.agents/skills' ), {
			recursive: true,
		} );

		for ( const [ file, source ] of Object.entries( files ) ) {
			const filePath = path.join( repositoryRoot, file );
			await mkdir( path.dirname( filePath ), { recursive: true } );
			await writeFile( filePath, source );
		}

		return repositoryRoot;
	}

	test( 'passes a valid catalog', async () => {
		const repositoryRoot = await createRepository( {
			'.agents/skills/testing/SKILL.md': VALID_SOURCE,
		} );

		await expect( validateSkills( { repositoryRoot } ) ).resolves.toEqual(
			[]
		);
	} );

	test( 'reports each problem with its file', async () => {
		const repositoryRoot = await createRepository( {
			'.agents/skills/testing/SKILL.md': VALID_SOURCE,
			'.agents/skills/renamed/SKILL.md': VALID_SOURCE,
			'.agents/skills/empty/notes.md': '',
			'.agents/skills/stray.md': '',
		} );

		await expect( validateSkills( { repositoryRoot } ) ).resolves.toEqual( [
			{
				file: '.agents/skills/empty/SKILL.md',
				line: 1,
				message: 'Missing SKILL.md.',
			},
			{
				file: '.agents/skills/renamed/SKILL.md',
				line: 2,
				message: expect.stringContaining( 'match the skill' ),
			},
			{
				file: '.agents/skills/stray.md',
				line: 1,
				message: expect.stringContaining( 'must be a directory' ),
			},
		] );
	} );
} );
