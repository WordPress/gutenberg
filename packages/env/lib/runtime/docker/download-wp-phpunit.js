'use strict';
/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );
const SimpleGit = require( 'simple-git' );

/**
 * @typedef {import('./config').WPConfig} WPConfig
 */

/**
 * A WordPress/wordpress-develop ref holding a version of the PHPUnit library.
 *
 * @typedef {Object} TestSuiteRef
 * @property {'branch'|'tag'} type Whether the ref is a branch or a tag.
 * @property {string}         name The branch or tag name.
 */

/**
 * Downloads the WordPress PHPUnit files for each environment into the appropriate directories.
 *
 * @param {WPConfig} config     The wp-env config object.
 * @param {Object}   wpVersions The WordPress versions for each environment.
 * @param {Object}   spinner    The spinner object to show progress.
 * @param {boolean}  debug      Indicates whether or not debug mode is active.
 * @return {Promise} Returns a promise which resolves when the downloads finish.
 */
function downloadWPPHPUnit( config, wpVersions, spinner, debug ) {
	const progresses = {};
	const getProgressSetter = ( id ) => ( progress ) => {
		progresses[ id ] = progress;
		spinner.text =
			'Downloading WordPress PHPUnit Suite.\n' +
			Object.entries( progresses )
				.map(
					( [ key, value ] ) =>
						`  - ${ key }: ${ ( value * 100 ).toFixed( 0 ) }/100%`
				)
				.join( '\n' );
	};

	const promises = [];
	for ( const env in config.env ) {
		if ( env === 'tests' && config.testsEnvironment === false ) {
			continue;
		}
		const wpVersion = wpVersions[ env ] ? wpVersions[ env ] : null;
		const directory = path.join(
			config.workDirectoryPath,
			env === 'development'
				? 'WordPress-PHPUnit'
				: 'tests-WordPress-PHPUnit'
		);
		promises.push(
			downloadTestSuite( directory, wpVersion, {
				onProgress: getProgressSetter,
				spinner,
				debug,
			} )
		);
	}

	return Promise.all( promises );
}

/**
 * Downloads the PHPUnit tests for a given WordPress version into the appropriate directory.
 *
 * @param {string}   directory          The directory to place the PHPUnit tests in.
 * @param {string}   wpVersion          The version of WordPress to install PHPUnit tests for. Trunk when empty.
 * @param {Object}   options
 * @param {Function} options.onProgress A function called with download progress. Will be invoked with one argument: a number that ranges from 0 to 1 which indicates current download progress for this source.
 * @param {Object}   options.spinner    A CLI spinner which indicates progress.
 * @param {boolean}  options.debug      True if debug mode is enabled.
 */
async function downloadTestSuite(
	directory,
	wpVersion,
	{ onProgress, spinner, debug }
) {
	const log = debug
		? ( message ) => {
				spinner.info( `SimpleGit: ${ message }` );
				spinner.start();
		  }
		: () => {};
	onProgress( 0 );

	const progressHandler = ( { progress } ) => {
		onProgress( progress / 100 );
	};

	log( 'Cloning or getting the PHPUnit suite from GitHub.' );
	const git = SimpleGit( { progress: progressHandler } );

	const isRepo =
		fs.existsSync( directory ) &&
		( await git.cwd( directory ).checkIsRepo( 'root' ) );

	if ( isRepo ) {
		log( 'Repo already exists, using it.' );
	} else {
		await git.clone(
			'https://github.com/WordPress/wordpress-develop.git',
			directory,
			{
				'--depth': '1',
				'--filter': 'blob:none',
				'--no-checkout': null,
			}
		);
		await git.cwd( directory );

		// We use a sparse checkout to minimize the amount of data we need to download.
		log( 'Enabling sparse checkout.' );
		await git.raw( 'sparse-checkout', 'set', '--cone', 'tests/phpunit' );
	}

	await fetchTestSuite( git, getTestSuiteRefs( wpVersion ), log );

	onProgress( 1 );
}

/**
 * Gets the WordPress/wordpress-develop refs to try, in order, for the PHPUnit
 * library that matches a WordPress version.
 *
 * A release uses its tag. A pre-release (alpha, beta or RC) uses its `X.Y`
 * branch, which exists from the moment that version branches off trunk, and
 * falls back to trunk before then. This keeps a maintenance branch between
 * point releases, such as 7.1.4-alpha, on that branch's tests instead of
 * trunk's, which can depend on code that only exists in trunk.
 *
 * @param {?string} wpVersion The WordPress version. Trunk when empty.
 * @return {TestSuiteRef[]} The refs to try, in order.
 */
function getTestSuiteRefs( wpVersion ) {
	const trunk = { type: 'branch', name: 'trunk' };
	if ( ! wpVersion ) {
		return [ trunk ];
	}

	const preRelease = wpVersion.match(
		/^(\d+\.\d+)(?:\.\d+)?-(?:alpha|beta|rc)/i
	);
	if ( preRelease ) {
		return [ { type: 'branch', name: preRelease[ 1 ] }, trunk ];
	}

	/*
	 * WordPress/wordpress-develop uses X.Y.Z tags, but WordPress reports X.Y
	 * for non-patch releases.
	 */
	const tag = /^\d+\.\d+$/.test( wpVersion ) ? `${ wpVersion }.0` : wpVersion;
	return [ { type: 'tag', name: tag } ];
}

/**
 * Fetches and checks out the first of the given refs that exists.
 *
 * A ref that does not exist moves on to the next one. Any other error, such as
 * a network failure, is thrown.
 *
 * @param {import('simple-git').SimpleGit} git  The SimpleGit instance for the PHPUnit suite directory.
 * @param {TestSuiteRef[]}                 refs The refs to try, in order.
 * @param {(message: string) => void}      log  Logs a debug message.
 */
async function fetchTestSuite( git, refs, log ) {
	for ( const [ index, ref ] of refs.entries() ) {
		const label = `${ ref.type } ${ ref.name }`;
		log( `Fetching ${ label }.` );
		try {
			await git.raw( [
				'fetch',
				'origin',
				...( ref.type === 'tag' ? [ 'tag' ] : [] ),
				ref.name,
				'--depth',
				'1',
			] );
		} catch ( error ) {
			const isLast = index === refs.length - 1;
			if (
				isLast ||
				! /couldn't find remote ref/i.test( error.message )
			) {
				throw error;
			}
			log( `${ label } does not exist.` );
			continue;
		}

		/*
		 * Check out what was just fetched. A local branch of the same name would
		 * still point at whatever an earlier run cloned.
		 */
		log( `Checking out ${ label }.` );
		await git.checkout( 'FETCH_HEAD' );
		return;
	}
}

module.exports = downloadWPPHPUnit;
module.exports.getTestSuiteRefs = getTestSuiteRefs;
module.exports.fetchTestSuite = fetchTestSuite;
