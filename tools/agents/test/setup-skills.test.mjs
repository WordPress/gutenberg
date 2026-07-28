import assert from 'node:assert/strict';
import {
	mkdtemp,
	mkdir,
	readFile,
	rm,
	symlink,
	writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { setupSkills } from '../setup-skills.mjs';

async function createRepository() {
	const repositoryRoot = await mkdtemp(
		path.join( os.tmpdir(), 'gutenberg-agent-skills-' )
	);
	const skillDirectory = path.join(
		repositoryRoot,
		'.agents/skills',
		'testing'
	);

	await mkdir( skillDirectory, { recursive: true } );
	await writeFile(
		path.join( skillDirectory, 'SKILL.md' ),
		'---\nname: testing\n'
	);

	return repositoryRoot;
}

test( 'links each canonical skill into the Claude directory', async ( t ) => {
	const repositoryRoot = await createRepository();
	t.after( () => rm( repositoryRoot, { recursive: true, force: true } ) );

	const result = await setupSkills( { repositoryRoot } );

	assert.deepEqual( result, {
		conflicts: [],
		copied: [],
		linked: [ '.claude/skills/testing' ],
	} );
	assert.equal(
		await readFile(
			path.join( repositoryRoot, '.claude/skills/testing/SKILL.md' ),
			'utf8'
		),
		'---\nname: testing\n'
	);
} );

test( 'uses junctions on Windows', async ( t ) => {
	const repositoryRoot = await createRepository();
	t.after( () => rm( repositoryRoot, { recursive: true, force: true } ) );
	const linkTypes = [];

	await setupSkills( {
		repositoryRoot,
		platform: 'win32',
		createLink: async ( source, target, type ) => {
			linkTypes.push( type );
			await symlink( source, target, 'dir' );
		},
	} );

	assert.deepEqual( linkTypes, [ 'junction' ] );
} );

test( 'replaces links generated from the former skills directory', async ( t ) => {
	const repositoryRoot = await createRepository();
	t.after( () => rm( repositoryRoot, { recursive: true, force: true } ) );
	const oldSkillDirectory = path.join( repositoryRoot, 'skills/testing' );
	const target = path.join( repositoryRoot, '.claude/skills/testing' );

	await mkdir( oldSkillDirectory, { recursive: true } );
	await mkdir( path.dirname( target ), { recursive: true } );
	await symlink( oldSkillDirectory, target, 'dir' );
	await rm( oldSkillDirectory, { recursive: true, force: true } );
	const result = await setupSkills( { repositoryRoot } );

	assert.deepEqual( result.linked, [ '.claude/skills/testing' ] );
	assert.equal(
		await readFile( path.join( target, 'SKILL.md' ), 'utf8' ),
		'---\nname: testing\n'
	);
} );

test( 'copies when links are unavailable and refreshes only managed copies', async ( t ) => {
	const repositoryRoot = await createRepository();
	t.after( () => rm( repositoryRoot, { recursive: true, force: true } ) );
	const unavailableLinks = async () => {
		const error = new Error( 'Links are unavailable.' );
		error.code = 'EPERM';
		throw error;
	};

	const firstResult = await setupSkills( {
		repositoryRoot,
		createLink: unavailableLinks,
	} );
	assert.deepEqual( firstResult.copied, [ '.claude/skills/testing' ] );

	await writeFile(
		path.join( repositoryRoot, '.agents/skills/testing/SKILL.md' ),
		'updated skill\n'
	);
	const refreshedResult = await setupSkills( {
		repositoryRoot,
		createLink: unavailableLinks,
	} );

	assert.deepEqual( refreshedResult.copied, [ '.claude/skills/testing' ] );
	assert.equal(
		await readFile(
			path.join( repositoryRoot, '.claude/skills/testing/SKILL.md' ),
			'utf8'
		),
		'updated skill\n'
	);
} );

test( 'leaves an existing unmanaged skill untouched', async ( t ) => {
	const repositoryRoot = await createRepository();
	t.after( () => rm( repositoryRoot, { recursive: true, force: true } ) );
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

	assert.deepEqual( result.conflicts, [ '.claude/skills/testing' ] );
	assert.equal(
		await readFile( path.join( unmanagedSkill, 'SKILL.md' ), 'utf8' ),
		'personal skill\n'
	);
} );
