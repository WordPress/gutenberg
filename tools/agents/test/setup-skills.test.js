import { execFile } from 'node:child_process';
import {
	mkdtemp,
	mkdir,
	lstat,
	readFile,
	rm,
	symlink,
	writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

import { setupSkills } from '../setup-skills.mjs';

const execFileAsync = promisify( execFile );
const setupScript = path.join( __dirname, '../setup-skills.mjs' );
const targetSkillPath = path.join( '.claude', 'skills', 'testing' );
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
	await mkdir( path.join( repositoryRoot, '.agents/skills' ), {
		recursive: true,
	} );

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
	test( 'links each canonical skill into the Claude directory', async () => {
		const repositoryRoot = await createRepository();

		const result = await setupSkills( { repositoryRoot } );

		expect( result ).toEqual( {
			conflicts: [],
			copied: [],
			linked: [ targetSkillPath ],
			removed: [],
		} );
		expect(
			await readFile(
				path.join( repositoryRoot, '.claude/skills/testing/SKILL.md' ),
				'utf8'
			)
		).toBe( '---\nname: testing\n' );
	} );

	test( 'links skills added after an earlier setup', async () => {
		const repositoryRoot = await createRepository( [] );

		await setupSkills( { repositoryRoot } );
		await createSkill( repositoryRoot, 'testing' );
		const result = await setupSkills( { repositoryRoot } );

		expect( result.linked ).toEqual( [ targetSkillPath ] );
		expect(
			await readFile(
				path.join( repositoryRoot, '.claude/skills/testing/SKILL.md' ),
				'utf8'
			)
		).toBe( '---\nname: testing\n' );
	} );

	test( 'runs the setup command when executed directly', async () => {
		const repositoryRoot = await createRepository();

		const { stdout } = await execFileAsync(
			process.execPath,
			[ setupScript ],
			{
				cwd: repositoryRoot,
			}
		);

		expect( stdout ).toBe( `Linked: ${ targetSkillPath }\n` );
		expect(
			await readFile(
				path.join( repositoryRoot, '.claude/skills/testing/SKILL.md' ),
				'utf8'
			)
		).toBe( '---\nname: testing\n' );
	} );

	test( 'removes links for skills removed from the canonical directory', async () => {
		const repositoryRoot = await createRepository();
		const source = path.join( repositoryRoot, '.agents/skills/testing' );
		const target = path.join( repositoryRoot, '.claude/skills/testing' );

		await setupSkills( { repositoryRoot } );
		await rm( source, { recursive: true, force: true } );
		const result = await setupSkills( { repositoryRoot } );

		expect( result.removed ).toEqual( [ targetSkillPath ] );
		await expect( lstat( target ) ).rejects.toMatchObject( {
			code: 'ENOENT',
		} );
	} );

	test( 'leaves unmanaged targets for removed skills untouched', async () => {
		const repositoryRoot = await createRepository( [] );
		const target = path.join( repositoryRoot, '.claude/skills/testing' );

		await mkdir( target, { recursive: true } );
		await writeFile( path.join( target, 'SKILL.md' ), 'personal skill\n' );
		const result = await setupSkills( { repositoryRoot } );

		expect( result.removed ).toEqual( [] );
		expect(
			await readFile( path.join( target, 'SKILL.md' ), 'utf8' )
		).toBe( 'personal skill\n' );
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

	test( 'uses junctions on Windows', async () => {
		const repositoryRoot = await createRepository();
		const linkTypes = [];

		await setupSkills( {
			repositoryRoot,
			platform: 'win32',
			createLink: async ( source, target, type ) => {
				linkTypes.push( type );
				await symlink( source, target, type );
			},
		} );

		expect( linkTypes ).toEqual( [ 'junction' ] );
	} );

	test( 'replaces links generated from the former skills directory', async () => {
		const repositoryRoot = await createRepository();
		const oldSkillDirectory = path.join( repositoryRoot, 'skills/testing' );
		const target = path.join( repositoryRoot, '.claude/skills/testing' );

		await mkdir( oldSkillDirectory, { recursive: true } );
		await mkdir( path.dirname( target ), { recursive: true } );
		await symlink(
			oldSkillDirectory,
			target,
			process.platform === 'win32' ? 'junction' : 'dir'
		);
		await rm( oldSkillDirectory, { recursive: true, force: true } );
		const result = await setupSkills( { repositoryRoot } );

		expect( result.linked ).toEqual( [ targetSkillPath ] );
		expect(
			await readFile( path.join( target, 'SKILL.md' ), 'utf8' )
		).toBe( '---\nname: testing\n' );
	} );

	test( 'copies when links are unavailable and refreshes only managed copies', async () => {
		const repositoryRoot = await createRepository();
		const unavailableLinks = async () => {
			const error = new Error( 'Links are unavailable.' );
			error.code = 'EPERM';
			throw error;
		};

		const firstResult = await setupSkills( {
			repositoryRoot,
			createLink: unavailableLinks,
		} );
		expect( firstResult.copied ).toEqual( [ targetSkillPath ] );

		await writeFile(
			path.join( repositoryRoot, '.agents/skills/testing/SKILL.md' ),
			'updated skill\n'
		);
		const refreshedResult = await setupSkills( {
			repositoryRoot,
			createLink: unavailableLinks,
		} );

		expect( refreshedResult.copied ).toEqual( [ targetSkillPath ] );
		expect(
			await readFile(
				path.join( repositoryRoot, '.claude/skills/testing/SKILL.md' ),
				'utf8'
			)
		).toBe( 'updated skill\n' );

		await rm( path.join( repositoryRoot, '.agents/skills/testing' ), {
			recursive: true,
			force: true,
		} );
		const removedResult = await setupSkills( {
			repositoryRoot,
			createLink: unavailableLinks,
		} );

		expect( removedResult.removed ).toEqual( [ targetSkillPath ] );
		await expect(
			lstat( path.join( repositoryRoot, '.claude/skills/testing' ) )
		).rejects.toMatchObject( { code: 'ENOENT' } );
	} );

	test( 'leaves an existing unmanaged skill untouched', async () => {
		const repositoryRoot = await createRepository();
		const unmanagedSkill = path.join(
			repositoryRoot,
			'.claude/skills/testing'
		);

		await mkdir( unmanagedSkill, { recursive: true } );
		await writeFile(
			path.join( unmanagedSkill, 'SKILL.md' ),
			'personal skill\n'
		);
		const result = await setupSkills( { repositoryRoot } );

		expect( result.conflicts ).toEqual( [ targetSkillPath ] );
		expect(
			await readFile( path.join( unmanagedSkill, 'SKILL.md' ), 'utf8' )
		).toBe( 'personal skill\n' );
	} );
} );
