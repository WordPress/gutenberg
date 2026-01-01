#!/usr/bin/env node

/**
 * External dependencies
 */
import spawn from 'cross-spawn';

/**
 * Internal dependencies
 */
import { checkDeps, getLicenses } from '../packages/scripts/utils/license.js';

const ignored = [
	'@ampproject/remapping',
	'webpack',
	// Jest internals with Apache-2.0 license - only used for testing, not distributed.
	'bser',
	'fb-watchman',
	'walker',
];

/*
 * `wp-scripts check-licenses` uses prod and dev dependencies of the package to scan for dependencies. With npm workspaces, workspace packages (the @wordpress/* packages) are not listed in the main package json and this approach does not work.
 *
 * Instead, work from an npm query that uses some custom information in package.json files to declare packages that are shipped with WordPress (and must be GPLv2 compatible) or other files that may use more permissive licenses.
 */

const licenses = getLicenses( true );
const query = `.workspace:attr([wpScript],[wpScriptModuleExports]) :is(.prod):not(${ licenses
	.map( ( license ) => `[license=${ JSON.stringify( license ) }]` )
	.join( ',' ) })`;

// Use `npm query` to grab a list of all the packages for workspaces.
const child = spawn.sync( 'npm', [ 'query', query ] );

const dependenciesToProcess = JSON.parse( child.stdout.toString() );

checkDeps( dependenciesToProcess, {
	ignored,
	gpl2: true,
} );
