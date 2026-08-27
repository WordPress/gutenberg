/**
 * Checks the confinement both agents run under, without spending model calls.
 *
 * `specs/sandbox` proves the subject's boundary by behaviour, which is the
 * stronger evidence. The grader resists the same treatment: asking it to read
 * outside its workspace and report what happened derails the JSON verdict
 * `agent-rubric` has to return, so its verdict comes back as an error and the
 * markers are absent for the wrong reason.
 *
 * So the grader is checked here instead, by resolving a row the way Promptfoo
 * would and asserting what the two providers are handed.
 *
 *   npm run test:sandbox
 */
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import base from '../base.js';
import { KEPT } from '../environment.js';
import { extensionHook } from '../workspace-extension.mjs';

const repositoryRoot = path.resolve(
	path.dirname( fileURLToPath( import.meta.url ) ),
	'../../../..'
);

/**
 * Resolves one row, as `beforeEach` would.
 *
 * @return {Promise<Object>} The row's options, and a cleanup callback.
 */
async function resolveRow() {
	const { test: resolved } = await extensionHook( 'beforeEach', {
		test: { vars: {}, options: { ...base.defaultTest.options } },
	} );

	return {
		options: resolved.options,
		cleanup: () =>
			extensionHook( 'afterEach', {
				test: {
					options: { working_dir: resolved.options.working_dir },
				},
			} ),
	};
}

test( 'both agents are denied the checkout, the home directory and the temp root', async () => {
	const { options, cleanup } = await resolveRow();

	try {
		const subject = options.sandbox.filesystem;
		const grader = options.provider.config.sandbox.filesystem;

		for ( const [ label, filesystem ] of [
			[ 'subject', subject ],
			[ 'grader', grader ],
		] ) {
			assert.ok(
				filesystem.denyRead.includes( repositoryRoot ),
				`${ label } can read the checkout`
			);
			assert.ok(
				filesystem.denyRead.includes( os.homedir() ),
				`${ label } can read the home directory`
			);
			assert.ok(
				filesystem.denyRead.includes( os.tmpdir() ),
				`${ label } can read other workspaces`
			);
			assert.deepEqual(
				filesystem.allowRead,
				[ options.working_dir ],
				`${ label } is not scoped to this row's workspace`
			);
		}
	} finally {
		await cleanup();
	}
} );

test( 'neither agent inherits the environment that started the run', async () => {
	const { options, cleanup } = await resolveRow();

	try {
		const inherited = Object.keys( process.env ).filter(
			( name ) => ! KEPT.includes( name )
		);

		for ( const [ label, environment ] of [
			[ 'subject', base.providers[ 0 ].config.env ],
			[ 'grader', options.provider.config.env ],
		] ) {
			const leaked = inherited.filter(
				( name ) => environment[ name ] !== ''
			);

			assert.deepEqual(
				leaked,
				[],
				`${ label } passes on ${ leaked.length } variables from the host`
			);

			for ( const name of KEPT ) {
				assert.equal(
					environment[ name ],
					undefined,
					`${ label } overrides ${ name }, which a shell needs`
				);
			}
		}
	} finally {
		await cleanup();
	}
} );

test( 'neither agent can reach Docker', async () => {
	const { options, cleanup } = await resolveRow();

	try {
		assert.match(
			base.providers[ 0 ].config.env.DOCKER_HOST,
			/nonexistent/,
			'subject can reach the Docker daemon'
		);
		assert.match(
			options.provider.config.env.DOCKER_HOST,
			/nonexistent/,
			'grader can reach the Docker daemon'
		);
	} finally {
		await cleanup();
	}
} );
