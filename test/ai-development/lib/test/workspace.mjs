import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import withWorkspaceChanges from '../diff.js';
import { git } from '../git.mjs';
import { workspace } from '../paths.js';
import { extensionHook, prepareClaudeDirectory } from '../workspace.mjs';

test( 'replaces a .claude symlink without changing its target', async ( t ) => {
	const fixtureRoot = fs.mkdtempSync(
		path.join( os.tmpdir(), 'gutenberg-eval-symlink-' )
	);
	const repositoryRoot = path.join( fixtureRoot, 'repository' );
	const outsideClaudeDirectory = path.join( fixtureRoot, 'outside-claude' );
	const outsideSettings = path.join(
		outsideClaudeDirectory,
		'settings.json'
	);
	const outsideSkill = path.join(
		outsideClaudeDirectory,
		'skills/original/SKILL.md'
	);
	const repositorySkill = path.join(
		repositoryRoot,
		'.agents/skills/testing/SKILL.md'
	);

	t.after( () => fs.rmSync( fixtureRoot, { recursive: true, force: true } ) );

	fs.mkdirSync( path.dirname( outsideSkill ), { recursive: true } );
	fs.mkdirSync( path.dirname( repositorySkill ), { recursive: true } );
	fs.writeFileSync( outsideSettings, '{ "outside": true }' );
	fs.writeFileSync( outsideSkill, 'outside skill' );
	fs.writeFileSync( repositorySkill, 'repository skill' );
	fs.symlinkSync(
		outsideClaudeDirectory,
		path.join( repositoryRoot, '.claude' ),
		process.platform === 'win32' ? 'junction' : 'dir'
	);

	await prepareClaudeDirectory( repositoryRoot );

	assert.equal(
		fs.readFileSync( outsideSettings, 'utf8' ),
		'{ "outside": true }'
	);
	assert.equal( fs.readFileSync( outsideSkill, 'utf8' ), 'outside skill' );
	assert.equal(
		fs.readFileSync(
			path.join( repositoryRoot, '.claude/skills/testing/SKILL.md' ),
			'utf8'
		),
		'repository skill'
	);
	assert.equal(
		fs.lstatSync( path.join( repositoryRoot, '.claude' ) ).isDirectory(),
		true
	);
} );

test( 'restores trusted Git metadata and ignored state between rows', async ( t ) => {
	const filterMarker = path.join(
		os.tmpdir(),
		`gutenberg-eval-filter-${ randomUUID() }`
	);
	const filterScript = path.join( workspace, 'filter-probe.mjs' );
	const quoteForGitShell = ( value ) =>
		`'${ value.replaceAll( '\\', '/' ).replaceAll( "'", "'\\''" ) }'`;

	t.after( async () => {
		await extensionHook( 'afterAll' );
		fs.rmSync( filterMarker, { force: true } );
	} );

	await extensionHook( 'beforeAll' );
	fs.writeFileSync(
		filterScript,
		`import fs from 'node:fs';\nfs.writeFileSync( ${ JSON.stringify(
			filterMarker
		) }, 'ran' );\nprocess.stdin.pipe( process.stdout );\n`
	);
	await git( workspace, [
		'config',
		'filter.escape.clean',
		`${ quoteForGitShell( process.execPath ) } ${ quoteForGitShell(
			filterScript
		) }`,
	] );
	fs.writeFileSync(
		path.join( workspace, '.gitattributes' ),
		'* filter=escape'
	);
	fs.writeFileSync( path.join( workspace, 'filter-probe' ), 'probe' );
	await git( workspace, [ 'add', '--', 'filter-probe.mjs' ] );
	assert.equal(
		fs.existsSync( filterMarker ),
		true,
		'the malicious clean-filter fixture did not run'
	);
	fs.rmSync( filterMarker );

	await withWorkspaceChanges( '' );
	assert.equal(
		fs.existsSync( filterMarker ),
		false,
		'host Git ran an agent-controlled clean filter'
	);

	const skillMarker = path.join( workspace, '.claude/skills/row-one-marker' );
	fs.writeFileSync( skillMarker, 'row one' );
	await extensionHook( 'afterEach' );
	assert.equal( fs.existsSync( skillMarker ), false );
	assert.equal(
		fs.existsSync(
			path.join( workspace, '.claude/skills/testing/SKILL.md' )
		),
		true,
		'the reset did not regenerate the skill catalog'
	);

	// Promptfoo can continue after an `afterEach` failure. The next row must
	// therefore establish the same clean state before it starts. A settings
	// file is the sharpest thing a row can leave behind: its sandbox arrays
	// merge from every settings source, so one that survived a reset would
	// weaken the next row's boundary.
	fs.writeFileSync( skillMarker, 'failed cleanup' );
	const plantedSettings = path.join( workspace, '.claude/settings.json' );
	fs.writeFileSync( plantedSettings, '{}' );
	await extensionHook( 'beforeEach' );
	assert.equal( fs.existsSync( skillMarker ), false );
	assert.equal( fs.existsSync( plantedSettings ), false );
} );
