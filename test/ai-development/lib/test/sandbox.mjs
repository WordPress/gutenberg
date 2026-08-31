/*
 * Promptfoo is installed from this test package's standalone lockfile, not the
 * repository's root lockfile.
 */
/* eslint import/no-unresolved: off */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { loadApiProvider } from 'promptfoo';
import {
	checkoutMarkerFile,
	homeMarkerFile,
	outsideMarkerFile,
} from '../../specs/sandbox/probe-file.js';

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
