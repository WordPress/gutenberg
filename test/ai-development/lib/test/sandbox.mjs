/*
 * Promptfoo is installed from this test package's standalone lockfile, not the
 * repository's root lockfile.
 */
/* eslint import/no-unresolved: off */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { loadApiProvider } from 'promptfoo';
import { sourceRoot, trustedGitDirectory, workspace } from '../paths.js';
import { pathRule, permissionRules, permissions, sandbox } from '../sandbox.js';
import {
	checkoutMarkerFile,
	homeMarkerFile,
	outsideMarkerFile,
} from '../../specs/sandbox/probe-file.js';

test( 'the sandbox denies reads by region, not by denying the root', () => {
	// Denying `/` takes the system libraries with it; a profile no command can
	// run under is discarded rather than enforced, leaving reads open.
	assert.equal( sandbox.filesystem.denyRead.includes( '/' ), false );
	assert.equal( sandbox.filesystem.allowRead.includes( workspace ), true );
	// The re-allowed workspace only means something if a denied region
	// surrounds it — otherwise its siblings in the temp directory are open.
	assert.equal(
		sandbox.filesystem.denyRead.some( ( denied ) =>
			workspace.startsWith( `${ denied }${ path.sep }` )
		),
		true,
		'no denied read region surrounds the workspace'
	);
} );

test( 'an empty network allowlist is a deterministic denial', () => {
	// Without `strictAllowlist` a host outside the list prompts instead, and a
	// headless run resolves that prompt as an allow.
	assert.deepEqual( sandbox.network, {
		allowedDomains: [],
		strictAllowlist: true,
	} );
} );

test( 'permission rules are anchored as absolute paths', () => {
	// `//` means an absolute path; one slash anchors to the settings source
	// and three parse as a settings-relative pattern that matches nothing.
	for ( const rule of permissions.deny ) {
		assert.match( rule, /^(Read|Edit)\(\/\/[^/]/ );
		assert.doesNotMatch( rule, /\\|:/, `${ rule } is not in POSIX form` );
	}
} );

test( 'a rule renders the path the way Claude Code matches it', () => {
	// Claude Code matches patterns in POSIX form; on Windows `C:\Users\alice`
	// matches as `/c/Users/alice`. Exercised directly, so the Windows shape is
	// covered on every platform.
	assert.equal(
		pathRule( 'Read', 'C:\\Users\\runneradmin' ),
		'Read(//c/Users/runneradmin/**)'
	);
	assert.equal(
		pathRule( 'Edit', '/Users/alice' ),
		'Edit(//Users/alice/**)'
	);
} );

test( 'permission rules do not deny a workspace inside the home directory', () => {
	const home = 'C:\\Users\\runneradmin';
	const source = 'D:\\a\\gutenberg';
	const workingDirectory = `${ home }\\AppData\\Local\\Temp\\gutenberg-agent-eval-1`;

	assert.deepEqual(
		permissionRules( [ home, source ], workingDirectory, path.win32 ),
		[ 'Read(//d/a/gutenberg/**)', 'Edit(//d/a/gutenberg/**)' ]
	);
} );

test( 'trusted Git metadata is inside an Edit-denied directory', () => {
	const relative = path.relative( sourceRoot, trustedGitDirectory );
	const isInsideSourceRoot =
		relative === '' ||
		( relative !== '..' &&
			! relative.startsWith( `..${ path.sep }` ) &&
			! path.isAbsolute( relative ) );

	assert.equal( isInsideSourceRoot, true );
	assert.equal(
		permissions.deny.includes( pathRule( 'Edit', sourceRoot ) ),
		true
	);
} );

test( 'loading the sandbox config does not create host canaries', () => {
	assert.equal( fs.existsSync( homeMarkerFile ), false );
	assert.equal( fs.existsSync( checkoutMarkerFile ), false );
	assert.equal( fs.existsSync( outsideMarkerFile ), false );
} );

test( 'denies an Anthropic API key restored by Promptfoo', async () => {
	const previous = process.env.ANTHROPIC_API_KEY;
	const marker = 'promptfoo-restored-anthropic-key';
	process.env.ANTHROPIC_API_KEY = marker;

	try {
		const { default: base } = await import( '../base.js' );
		const subject = base.providers[ 0 ];
		const provider = await loadApiProvider( subject.id, {
			options: subject,
		} );

		// This proves the locked Promptfoo version captured the host key despite
		// the blank value in `config.env`.
		assert.equal( provider.apiKey, marker );
		assert.deepEqual( provider.config.sandbox.credentials.envVars, [
			{ name: 'ANTHROPIC_API_KEY', mode: 'deny' },
		] );
	} finally {
		if ( previous === undefined ) {
			delete process.env.ANTHROPIC_API_KEY;
		} else {
			process.env.ANTHROPIC_API_KEY = previous;
		}
	}
} );
