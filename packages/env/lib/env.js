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

// Config Variables
const pluginPath = process.cwd();
const pluginName = path.basename( pluginPath );
const pluginTestsPath = fs.existsSync( './packages' ) ? '/packages' : '';
const scriptsPath = path.join( __dirname, './scripts' );
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
		`wp core install --url=localhost:888${
			isTests ? '9' : '8'
		} --title=Gutenberg --admin_user=admin --admin_password=password --admin_email=admin@wordpress.org`,
		isTests
	);
const activatePlugin = ( isTests = false ) =>
	wpCliRun( `wp plugin activate ${ pluginName }`, isTests );
const resetDatabase = ( isTests = false ) =>
	wpCliRun( 'wp db reset --yes', isTests );

module.exports = {
	async start( { ref, spinner = {} } ) {
		spinner.text = `Downloading WordPress@${ ref } 0/100%.`;
		let percent = 0;
		const gitFetchOptions = {
			fetchOpts: {
				callbacks: {
					transferProgress( progress ) {
						// Fetches are finished when all objects are received and indexed,
						// so received objects plus indexed objects should equal twice
						// the total number of objects when done.
						percent = Math.max(
							percent,
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
		const cloneOrGetRepo = async ( repoPath ) => {
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
		};
		await Promise.all( [
			cloneOrGetRepo( `../${ pluginName }-wordpress/` ),
			cloneOrGetRepo( `../${ pluginName }-tests-wordpress/` ),
		] );
		spinner.text = `Downloading WordPress@${ ref } 100/100%.`;

		spinner.text = `Installing WordPress@${ ref }.`;
		fs.writeFileSync(
			dockerComposeOptions.config,
			createDockerComposeConfig(
				pluginPath,
				pluginName,
				pluginTestsPath,
				scriptsPath
			)
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

		await Promise.all( [ activatePlugin(), activatePlugin( true ) ] );

		// Remove dangling containers and finish.
		await dockerCompose.rm( dockerComposeOptions );
		spinner.text = `Installed WordPress@${ ref }.`;
	},

	async stop( { spinner = {} } ) {
		spinner.text = 'Stopping WordPress.';
		await dockerCompose.stop( dockerComposeOptions );
		spinner.text = 'Stopped WordPress.';
	},

	async clean( { environment, spinner } ) {
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
					.then( activatePlugin )
					.catch( () => {} )
			);
		}
		if ( environment === 'all' || environment === 'tests' ) {
			tasks.push(
				resetDatabase( true )
					.then( setupSite.bind( null, true ) )
					.then( activatePlugin.bind( null, true ) )
					.catch( () => {} )
			);
		}
		await Promise.all( tasks );

		// Remove dangling containers and finish.
		await dockerCompose.rm( dockerComposeOptions );
		spinner.text = `Cleaned ${ description }.`;
	},

	async run( { container, command, spinner } ) {
		command = command.join( ' ' );
		spinner.text = `Running \`${ command }\` in "${ container }".`;

		if ( container === 'tests-wordpress-phpunit' ) {
			// Run this "on-demand" to avoid making `start` slower.
			await dockerCompose
				.run(
					'tests-wordpress-phpunit',
					'/scripts/install-tests-wordpress-phpunit.sh tests-wordpress-phpunit root password mysql',
					dockerComposeOptions
				)
				.catch( () => {} );
		}

		const result = await dockerCompose.run(
			container,
			command,
			dockerComposeOptions
		);
		if ( result.out ) {
			// eslint-disable-next-line no-console
			console.log( `\n\n${ result.out }\n\n` );
		} else if ( result.err ) {
			// eslint-disable-next-line no-console
			console.error( `\n\n${ result.err }\n\n` );
			throw result.err;
		}

		// Remove dangling containers and finish.
		await dockerCompose.rm( dockerComposeOptions );
		spinner.text = `Ran \`${ command }\` in "${ container }".`;
	},
};
