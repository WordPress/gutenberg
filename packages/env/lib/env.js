'use strict';
/**
 * External dependencies
 */
const path = require( 'path' );
const fs = require( 'fs' );
const dockerCompose = require( 'docker-compose' );
const NodeGit = require( 'nodegit' );
const wait = require( 'util' ).promisify( setTimeout );

/**
 * Internal dependencies
 */
const createDockerComposeConfig = require( './create-docker-compose-config' );
const detectContext = require( './detect-context' );
const resolveDependencies = require( './resolve-dependencies' );

// Config Variables
const cwd = process.cwd();
const cwdName = path.basename( cwd );
const cwdTestsPath = fs.existsSync( './packages' ) ? '/packages' : '';
const dockerComposeOptions = {
	config: path.join( __dirname, 'docker-compose.yml' ),
};

// WP CLI Utils
const wpCliRun = ( command, isTests = false ) =>
	dockerCompose.run(
		`${ isTests ? 'tests-' : '' }wordpress-cli`,
		command,
		dockerComposeOptions
	);
const setupSite = ( isTests = false ) =>
	wpCliRun(
		`wp core install --url=localhost:${
			isTests ?
				process.env.WP_ENV_TESTS_PORT || 8889 :
				process.env.WP_ENV_PORT || 8888
		} --title=${ cwdName } --admin_user=admin --admin_password=password --admin_email=admin@wordpress.org`,
		isTests
	);
const activateContext = ( { type, pathName }, isTests = false ) =>
	wpCliRun( `wp ${ type } activate ${ pathName }`, isTests );
const resetDatabase = ( isTests = false ) =>
	wpCliRun( 'wp db reset --yes', isTests );

module.exports = {
	async start( { ref, spinner = {} } ) {
		const context = await detectContext();
		const dependencies = await resolveDependencies();

		spinner.text = `Downloading WordPress@${ ref } 0/100%.`;
		const gitFetchOptions = {
			fetchOpts: {
				callbacks: {
					transferProgress( progress ) {
						// Fetches are finished when all objects are received and indexed,
						// so received objects plus indexed objects should equal twice
						// the total number of objects when done.
						const percent = (
							( ( progress.receivedObjects() + progress.indexedObjects() ) /
								( progress.totalObjects() * 2 ) ) *
							100
						).toFixed( 0 );
						spinner.text = `Downloading WordPress@${ ref } ${ percent }/100%.`;
					},
				},
			},
		};

		// Clone or get the repo.
		const repoPath = `../${ cwdName }-wordpress/`;
		const repo = await NodeGit.Clone(
			'https://github.com/WordPress/WordPress.git',
			repoPath,
			gitFetchOptions
		)
			// Repo already exists, get it.
			.catch( () => NodeGit.Repository.open( repoPath ) );

		// Checkout the specified ref.
		const remote = await repo.getRemote( 'origin' );
		await remote.fetch( ref, gitFetchOptions.fetchOpts );
		await remote.disconnect();
		try {
			await repo.checkoutRef(
				await repo
					.getReference( 'FETCH_HEAD' )
					// Sometimes git doesn't update FETCH_HEAD for things
					// like tags so we try another method here.
					.catch( repo.getReference.bind( repo, ref ) ),
				{
					checkoutStrategy: NodeGit.Checkout.STRATEGY.FORCE,
				}
			);
		} catch ( err ) {
			// Some commit refs need to be set as detached.
			await repo.setHeadDetached( ref );
		}
		spinner.text = `Downloading WordPress@${ ref } 100/100%.`;

		spinner.text = `Starting WordPress@${ ref }.`;
		fs.writeFileSync(
			dockerComposeOptions.config,
			createDockerComposeConfig( cwdTestsPath, context, dependencies )
		);

		// These will bring up the database container,
		// because it's a dependency.
		await dockerCompose.upMany(
			[ 'wordpress', 'tests-wordpress' ],
			dockerComposeOptions
		);

		const retryableSiteSetup = async () => {
			try {
				await Promise.all( [ setupSite(), setupSite( true ) ] );
			} catch ( err ) {
				await wait( 5000 );
				throw err;
			}
		};
		// Try a few times, in case
		// the database wasn't ready.
		await retryableSiteSetup()
			.catch( retryableSiteSetup )
			.catch( retryableSiteSetup );

		await Promise.all( [
			activateContext( context ),
			activateContext( context, true ),
			...dependencies.map( activateContext ),
		] );

		// Remove dangling containers and finish.
		await dockerCompose.rm( dockerComposeOptions );
		spinner.text = `Started WordPress@${ ref }.`;
	},

	async stop( { spinner = {} } ) {
		spinner.text = 'Stopping WordPress.';
		await dockerCompose.stop( dockerComposeOptions );
		spinner.text = 'Stopped WordPress.';
	},

	async clean( { environment, spinner } ) {
		const context = await detectContext();

		const description = `${ environment } environment${
			environment === 'all' ? 's' : ''
		}`;
		spinner.text = `Cleaning ${ description }.`;

		// Parallelize task sequences for each environment.
		const tasks = [];
		if ( environment === 'all' || environment === 'development' ) {
			tasks.push(
				resetDatabase()
					.then( setupSite )
					.then( activateContext.bind( null, context ) )
					.catch( () => {} )
			);
		}
		if ( environment === 'all' || environment === 'tests' ) {
			tasks.push(
				resetDatabase( true )
					.then( setupSite.bind( null, true ) )
					.then( activateContext.bind( null, context, true ) )
					.catch( () => {} )
			);
		}
		await Promise.all( tasks );

		// Remove dangling containers and finish.
		await dockerCompose.rm( dockerComposeOptions );
		spinner.text = `Cleaned ${ description }.`;
	},
};
