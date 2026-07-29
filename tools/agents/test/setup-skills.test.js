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

async function createFloatingSkill( repositoryRoot, skillName ) {
	const skillDirectory = path.join(
		repositoryRoot,
		'.claude/skills',
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

	test( 'initializes the Claude directory when it is absent', async () => {
		const repositoryRoot = await createRepository();

		const generated = await setupSkills( {
			repositoryRoot,
			ifSafe: true,
		} );

		expect( generated ).toBe( true );
		await expect(
			readFile(
				path.join( repositoryRoot, '.claude/skills/testing/SKILL.md' ),
				'utf8'
			)
		).resolves.toBe( '---\nname: testing\n' );
	} );

	test( 'updates the Claude directory when it has only canonical skills', async () => {
		const repositoryRoot = await createRepository();
		await setupSkills( { repositoryRoot } );
		await writeFile(
			path.join( repositoryRoot, '.agents/skills/testing/SKILL.md' ),
			'---\nname: updated testing\n'
		);
		await createSkill( repositoryRoot, 'release' );

		const confirm = jest.fn();
		const generated = await setupSkills( {
			repositoryRoot,
			confirm,
			ifSafe: true,
		} );

		expect( generated ).toBe( true );
		expect( confirm ).not.toHaveBeenCalled();
		await expect(
			readFile(
				path.join( repositoryRoot, '.claude/skills/testing/SKILL.md' ),
				'utf8'
			)
		).resolves.toBe( '---\nname: updated testing\n' );
		await expect(
			readFile(
				path.join( repositoryRoot, '.claude/skills/release/SKILL.md' ),
				'utf8'
			)
		).resolves.toBe( '---\nname: release\n' );
	} );

	test( 'leaves the Claude directory untouched when it has unmatched skills', async () => {
		const repositoryRoot = await createRepository();
		await setupSkills( { repositoryRoot } );
		await createFloatingSkill( repositoryRoot, 'private' );
		const confirm = jest.fn();

		const generated = await setupSkills( {
			repositoryRoot,
			confirm,
			ifSafe: true,
		} );

		expect( generated ).toBe( false );
		expect( confirm ).not.toHaveBeenCalled();
		await expect(
			readFile(
				path.join( repositoryRoot, '.claude/skills/private/SKILL.md' ),
				'utf8'
			)
		).resolves.toBe( '---\nname: private\n' );
	} );

	test( 'replaces the generated directory when the skill catalog changes', async () => {
		const repositoryRoot = await createRepository();
		const confirmedEntries = [];

		await setupSkills( { repositoryRoot } );
		await rm( path.join( repositoryRoot, '.agents/skills/testing' ), {
			recursive: true,
			force: true,
		} );
		await createSkill( repositoryRoot, 'release' );
		await setupSkills( {
			repositoryRoot,
			confirm: async ( entries ) => {
				confirmedEntries.push( ...entries );
				return true;
			},
		} );

		expect( confirmedEntries ).toEqual( [ 'testing' ] );
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

	test( 'leaves unmatched skills untouched when replacement is declined', async () => {
		const repositoryRoot = await createRepository();
		await createFloatingSkill( repositoryRoot, 'private' );

		const generated = await setupSkills( {
			repositoryRoot,
			confirm: async ( entries ) => {
				expect( entries ).toEqual( [ 'private' ] );
				return false;
			},
		} );

		expect( generated ).toBe( false );
		await expect(
			readFile(
				path.join( repositoryRoot, '.claude/skills/private/SKILL.md' ),
				'utf8'
			)
		).resolves.toBe( '---\nname: private\n' );
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

	test( 'skips unmatched Claude skills when run with --if-safe', async () => {
		const repositoryRoot = await createRepository();
		await createFloatingSkill( repositoryRoot, 'private' );

		const { stdout } = await execFileAsync(
			process.execPath,
			[ setupScript, '--if-safe' ],
			{ cwd: repositoryRoot }
		);

		expect( stdout ).toBe(
			'Skipped: .claude/skills contains entries that are not in .agents/skills. Run npm run agents:setup to apply skill catalog changes.\n'
		);
		await expect(
			readFile(
				path.join( repositoryRoot, '.claude/skills/private/SKILL.md' ),
				'utf8'
			)
		).resolves.toBe( '---\nname: private\n' );
	} );

	test( 'fails safely when unmatched skills need non-interactive confirmation', async () => {
		const repositoryRoot = await createRepository();
		await createFloatingSkill( repositoryRoot, 'private' );

		await expect(
			execFileAsync( process.execPath, [ setupScript ], {
				cwd: repositoryRoot,
			} )
		).rejects.toMatchObject( {
			code: 1,
			stderr: expect.stringContaining( 'Cannot replace .claude/skills' ),
		} );
		await expect(
			readFile(
				path.join( repositoryRoot, '.claude/skills/private/SKILL.md' ),
				'utf8'
			)
		).resolves.toBe( '---\nname: private\n' );
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
