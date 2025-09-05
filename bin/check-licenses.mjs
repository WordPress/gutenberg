#!/usr/bin/env node

/**
 * External dependencies
 */
import { spawnSync } from 'node:child_process';

/**
 * Internal dependencies
 */
import { checkDepsInTree } from '../packages/scripts/utils/license.js';

const ignored = [ '@ampproject/remapping', 'webpack' ];

/*
 * `wp-scripts check-licenses` uses prod and dev dependencies of the package to scan for dependencies. With npm workspaces, workspace packages (the @wordpress/* packages) are not listed in the main package json and this approach does not work.
 *
 * Instead, work from an npm query that uses some custom information in package.json files to declare packages that are shipped with WordPress (and must be GPLv2 compatible) or other files that may use more permissive licenses.
 */

/**
 * @typedef PackageInfo
 * @property {string} name Package name.
 */

/** @type {ReadonlyArray<PackageInfo>} */
const workspacePackages = JSON.parse(
	spawnSync(
		'npm',
		[
			'query',
			'.workspace:attr([wpScript]), .workspace:attr([wpScriptModuleExports])',
		],
		/*
		 * Set the max buffer to ~157MB, since the output size for
		 * prod is ~21 MB and dev is ~110 MB
		 */
		{ maxBuffer: 1024 * 1024 * 150 }
	).stdout
);

const packageNames = workspacePackages.map( ( { name } ) => name );

const dependenciesToProcess = JSON.parse(
	spawnSync(
		'npm',
		[
			'ls',
			'--json',
			'--long',
			'--all',
			'--lockfile-only',
			'--omit=dev',
			...packageNames.map(
				( packageName ) => `--workspace=${ packageName }`
			),
		],
		/*
		 * Set the max buffer to ~157MB, since the output size for
		 * prod is ~21 MB and dev is ~110 MB
		 */
		{ maxBuffer: 1024 * 1024 * 150 }
	).stdout
).dependencies;

checkDepsInTree( dependenciesToProcess, {
	ignored,
	gpl2: true,
} );
