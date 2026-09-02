import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import withWorkspaceChanges from '../diff.js';
import { git } from '../git.mjs';
import { workspace } from '../paths.js';
import { extensionHook } from '../workspace.mjs';

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
