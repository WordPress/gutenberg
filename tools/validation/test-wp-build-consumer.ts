import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { packWorkspacePackage } from './pack-workspace-package.ts';

const directory = mkdtempSync( path.join( tmpdir(), 'wp-build-consumer-' ) );
try {
	const consumer = path.join( directory, 'plugin' );
	cpSync(
		new URL( './fixtures/wp-build-consumer/', import.meta.url ),
		consumer,
		{
			recursive: true,
		}
	);
	const tarball = packWorkspacePackage(
		path.resolve( import.meta.dirname, '../../packages/wp-build' ),
		directory
	);
	const options = {
		cwd: consumer,
		stdio: 'inherit' as const,
		shell: process.platform === 'win32',
	};
	execFileSync(
		'npm',
		[
			'install',
			'--engine-strict',
			'--no-audit',
			'--no-fund',
			path.relative( consumer, tarball ),
		],
		options
	);
	execFileSync( 'npm', [ 'run', 'build' ], options );

	const scripts = path.join( consumer, 'build/scripts' );
	assert.match(
		readFileSync( path.join( scripts, 'greeting/index.min.js' ), 'utf8' ),
		/Hello from the plugin/
	);
	assert.match(
		readFileSync( path.join( scripts, 'registry.php' ), 'utf8' ),
		/'example-greeting'/
	);
} finally {
	rmSync( directory, { recursive: true, force: true } );
}
