/**
 * External dependencies
 */
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

/**
 * Internal dependencies
 */
import {
	BUILD_MODE,
	ensurePluginBuildMode,
	getBuildMode,
} from './ensure-plugin-build-mode.mjs';

const PLUGIN_CONSTANTS = '<?php plugin_dir_url( __FILE__ );\n';
const PLUGIN_ROUTES = '<?php function gutenberg_register_page_routes() {}\n';
const CORE_CONSTANTS = "<?php includes_url( 'build/' );\n";
const CORE_ROUTES = '<?php function wp_register_page_routes() {}\n';

function withTempRoot( callback ) {
	const rootDir = mkdtempSync( join( tmpdir(), 'gutenberg-e2e-preflight-' ) );

	try {
		return callback( rootDir );
	} finally {
		rmSync( rootDir, { force: true, recursive: true } );
	}
}

function writeBuildArtifacts(
	rootDir,
	{ constants = PLUGIN_CONSTANTS, routes = PLUGIN_ROUTES } = {}
) {
	const buildDir = join( rootDir, 'build' );
	mkdirSync( buildDir, { recursive: true } );
	writeFileSync( join( buildDir, 'constants.php' ), constants );
	writeFileSync( join( buildDir, 'routes.php' ), routes );
}

function createSpawnStub( onSpawn ) {
	const calls = [];

	return {
		calls,
		spawn( command, args, options ) {
			calls.push( { args, command, options } );
			onSpawn?.();
			return { status: 0 };
		},
	};
}

const silentStream = {
	write() {},
};

test( 'detects plugin-mode artifacts from a reused server without rebuilding', () =>
	withTempRoot( ( rootDir ) => {
		const spawnStub = createSpawnStub();
		writeBuildArtifacts( rootDir );

		const result = ensurePluginBuildMode( {
			env: {},
			rootDir,
			spawn: spawnStub.spawn,
			stdout: silentStream,
		} );

		assert.equal( getBuildMode( rootDir ), BUILD_MODE.PLUGIN );
		assert.deepEqual( result, {
			buildModeBefore: BUILD_MODE.PLUGIN,
			buildModeAfter: BUILD_MODE.PLUGIN,
			rebuilt: false,
		} );
		assert.equal( spawnStub.calls.length, 0 );
	} ) );

test( 'rebuilds core-mode artifacts from a reused server for plugin e2e startup', () =>
	withTempRoot( ( rootDir ) => {
		const spawnStub = createSpawnStub( () => {
			writeBuildArtifacts( rootDir );
		} );
		writeBuildArtifacts( rootDir, {
			constants: CORE_CONSTANTS,
			routes: CORE_ROUTES,
		} );

		const result = ensurePluginBuildMode( {
			env: { EXISTING_ENV: 'preserved' },
			rootDir,
			spawn: spawnStub.spawn,
			stdout: silentStream,
		} );

		assert.deepEqual( result, {
			buildModeBefore: BUILD_MODE.CORE,
			buildModeAfter: BUILD_MODE.PLUGIN,
			rebuilt: true,
		} );
		assert.equal( spawnStub.calls.length, 1 );
		assert.deepEqual( spawnStub.calls[ 0 ].args, [
			'run',
			'build',
			'--',
			'--skip-types',
			'--base-url=plugin_dir_url( __FILE__ )',
		] );
		assert.equal( spawnStub.calls[ 0 ].command, 'npm' );
		assert.equal( spawnStub.calls[ 0 ].options.cwd, rootDir );
		assert.equal(
			spawnStub.calls[ 0 ].options.env[ 'IS_GUTENBERG' + '_PLUGIN' ],
			'true'
		);
		assert.equal(
			spawnStub.calls[ 0 ].options.env[ 'IS_WORDPRESS' + '_CORE' ],
			'false'
		);
		assert.equal(
			spawnStub.calls[ 0 ].options.env.EXISTING_ENV,
			'preserved'
		);
		assert.equal( spawnStub.calls[ 0 ].options.stdio, 'inherit' );
	} ) );

test( 'builds missing artifacts for fresh e2e server startup', () =>
	withTempRoot( ( rootDir ) => {
		const spawnStub = createSpawnStub( () => {
			writeBuildArtifacts( rootDir );
		} );

		const result = ensurePluginBuildMode( {
			env: {},
			rootDir,
			spawn: spawnStub.spawn,
			stdout: silentStream,
		} );

		assert.deepEqual( result, {
			buildModeBefore: BUILD_MODE.MISSING,
			buildModeAfter: BUILD_MODE.PLUGIN,
			rebuilt: true,
		} );
		assert.equal( getBuildMode( rootDir ), BUILD_MODE.PLUGIN );
		assert.equal( spawnStub.calls.length, 1 );
	} ) );
