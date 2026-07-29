import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

import { setupSkills } from '../setup-skills.mjs';

const execFileAsync = promisify( execFile );
const setupScript = path.join( __dirname, '../setup-skills.mjs' );
const temporaryRoots = [];

afterEach( async () => {
	for ( const root of temporaryRoots.splice( 0 ) ) {
		await rm( root, { recursive: true, force: true } );
	}
} );

async function createRepository( skillNames = [ 'testing' ] ) {
	const repositoryRoot = await mkdtemp(
		path.join( os.tmpdir(), 'gutenberg-agent-skills-' )
	);
	temporaryRoots.push( repositoryRoot );

	for ( const skillName of skillNames ) {
		await createSkill( repositoryRoot, skillName );
	}

	return repositoryRoot;
}

async function createSkill( repositoryRoot, skillName ) {
	const skillDirectory = path.join(
		repositoryRoot,
		'.agents/skills',
		skillName
	);

	await mkdir( skillDirectory, { recursive: true } );
	await writeFile(
		path.join( skillDirectory, 'SKILL.md' ),
		`---\nname: ${ skillName }\n`
	);
}

describe( 'setupSkills', () => {
	test( 'copies every canonical skill into the Claude directory', async () => {
		const repositoryRoot = await createRepository( [
			'testing',
			'release',
		] );

		await setupSkills( { repositoryRoot } );

		await expect(
			readFile(
				path.join( repositoryRoot, '.claude/skills/testing/SKILL.md' ),
				'utf8'
			)
		).resolves.toBe( '---\nname: testing\n' );
		await expect(
			readFile(
				path.join( repositoryRoot, '.claude/skills/release/SKILL.md' ),
				'utf8'
			)
		).resolves.toBe( '---\nname: release\n' );
	} );

	test( 'replaces the generated directory when the skill catalog changes', async () => {
		const repositoryRoot = await createRepository();

		await setupSkills( { repositoryRoot } );
		await rm( path.join( repositoryRoot, '.agents/skills/testing' ), {
			recursive: true,
			force: true,
		} );
		await createSkill( repositoryRoot, 'release' );
		await setupSkills( { repositoryRoot } );

		await expect(
			readFile(
				path.join( repositoryRoot, '.claude/skills/testing/SKILL.md' ),
				'utf8'
			)
		).rejects.toMatchObject( { code: 'ENOENT' } );
		await expect(
			readFile(
				path.join( repositoryRoot, '.claude/skills/release/SKILL.md' ),
				'utf8'
			)
		).resolves.toBe( '---\nname: release\n' );
	} );

	test( 'runs the setup command when executed directly', async () => {
		const repositoryRoot = await createRepository();

		const { stdout } = await execFileAsync(
			process.execPath,
			[ setupScript ],
			{ cwd: repositoryRoot }
		);

		expect( stdout ).toBe( 'Generated: .claude/skills\n' );
	} );

	test( 'can be imported from an eval entrypoint', async () => {
		await expect(
			execFileAsync( process.execPath, [
				'--input-type=module',
				'--eval',
				`await import( ${ JSON.stringify(
					pathToFileURL( setupScript ).href
				) } );`,
			] )
		).resolves.toEqual( expect.objectContaining( { stdout: '' } ) );
	} );
} );
