'use strict';
const fs = require( 'fs' ).promises;
const { constants, existsSync } = require( 'fs' );
const path = require( 'path' );
const spawn = require( 'cross-spawn' );
const { rimraf } = require( 'rimraf' );
const { UnsupportedCommandError } = require( '../errors' );
const { downloadSource } = require( '../../download-sources' );
const { parseSourceString } = require( '../../config/parse-source-string' );

const SQLITE_PLUGIN_URL =
	'https://downloads.wordpress.org/plugin/sqlite-database-integration.zip';

/**
 * PHP runtime implementation for wp-env: the PHP installed on the computer
 * serves WordPress with its built-in web server and a SQLite database.
 */
class PhpRuntime {
	/**
	 * Get the name of this runtime.
	 *
	 * @return {string} Runtime name.
	 */
	getName() {
		return 'php';
	}

	/**
	 * Get the warning message for destroy confirmation.
	 *
	 * @return {string} Warning message.
	 */
	getDestroyWarningMessage() {
		return 'WARNING! This will remove the WordPress site and its database.';
	}

	/**
	 * Get the warning message for cleanup confirmation.
	 *
	 * @return {string} Warning message.
	 */
	getCleanupWarningMessage() {
		return 'WARNING! This will remove the WordPress site and its database.';
	}

	/**
	 * Start the PHP built-in server, setting up the site first if needed.
	 *
	 * @param {Object} config          The wp-env config object.
	 * @param {Object} options         Start options.
	 * @param {Object} options.spinner A CLI spinner which indicates progress.
	 * @return {Promise<Object>} The start message and site URL.
	 */
	async start( config, { spinner } ) {
		const envConfig = config.env.development;
		const siteDir = path.join( config.workDirectoryPath, 'php' );
		const { clean } = getDatabasePaths( config );

		if ( envConfig.multisite ) {
			throw new Error(
				'Multisite is not supported with the PHP runtime yet.'
			);
		}

		await this.stop( config, { spinner } );

		try {
			await fs.access( clean );
			// The port can change between starts.
			await writeWpConfig( config, siteDir );
		} catch {
			await this._setUp( config, siteDir, spinner );
		}

		const port = envConfig.port;
		const siteUrl = envConfig.config.WP_SITEURL;
		spinner.text = `Starting PHP on port ${ port }.`;

		const log = await fs.open( path.join( siteDir, 'server.log' ), 'w' );
		const child = spawn(
			'php',
			[
				// The same limits as the Docker runtime.
				'-d',
				'upload_max_filesize=1G',
				'-d',
				'post_max_size=1G',
				'-S',
				`localhost:${ port }`,
				'-t',
				siteDir,
				path.join( __dirname, 'router.php' ),
			],
			{
				detached: true,
				stdio: [ 'ignore', log.fd, log.fd ],
				// Without workers the server handles one request at a time.
				env: { ...process.env, PHP_CLI_SERVER_WORKERS: '8' },
			}
		);
		child.unref();
		await log.close();
		await fs.writeFile(
			path.join( siteDir, 'server.pid' ),
			String( child.pid )
		);

		await this._waitForServer( siteUrl );

		return {
			message: `WordPress development site started at ${ siteUrl }`,
			siteUrl,
		};
	}

	/**
	 * Stop the PHP built-in server.
	 *
	 * @param {Object} config          The wp-env config object.
	 * @param {Object} options         Stop options.
	 * @param {Object} options.spinner A CLI spinner which indicates progress.
	 */
	async stop( config, { spinner } ) {
		spinner.text = 'Stopping PHP.';
		const pidFile = path.join( config.workDirectoryPath, 'php/server.pid' );
		try {
			const pid = parseInt( await fs.readFile( pidFile, 'utf8' ), 10 );
			// The negative PID stops the server and its workers.
			process.kill( -pid, 'SIGTERM' );
		} catch {
			// Not running.
		}
		await rimraf( pidFile );
	}

	/**
	 * Remove the site and its database.
	 *
	 * @param {Object} config          The wp-env config object.
	 * @param {Object} options         Destroy options.
	 * @param {Object} options.spinner A CLI spinner which indicates progress.
	 */
	async destroy( config, { spinner } ) {
		await this.stop( config, { spinner } );
		spinner.text = 'Removing local files.';
		await rimraf( config.workDirectoryPath );
		spinner.text = 'Removed WordPress environment.';
	}

	/**
	 * Remove the site and its database. There is nothing shared to keep.
	 *
	 * @param {Object} config          The wp-env config object.
	 * @param {Object} options         Cleanup options.
	 * @param {Object} options.spinner A CLI spinner which indicates progress.
	 */
	async cleanup( config, { spinner } ) {
		await this.destroy( config, { spinner } );
	}

	/**
	 * Run a command in the environment. Not supported: there is no container.
	 */
	async run() {
		throw new UnsupportedCommandError( 'run' );
	}

	/**
	 * Restore the database to how it was right after installation.
	 *
	 * @param {Object} config          The wp-env config object.
	 * @param {Object} options         Clean options.
	 * @param {Object} options.spinner A CLI spinner which indicates progress.
	 */
	async clean( config, { spinner } ) {
		spinner.text = 'Resetting the database.';
		const { database, clean } = getDatabasePaths( config );
		await fs.copyFile( clean, database );
		spinner.text = 'Reset the database.';
	}

	/**
	 * Get the status of the environment.
	 *
	 * @param {Object} config The wp-env config object.
	 * @return {Promise<Object>} Status object with environment information.
	 */
	async getStatus( config ) {
		const envConfig = config.env.development;
		let isRunning = false;
		try {
			const pid = await fs.readFile(
				path.join( config.workDirectoryPath, 'php/server.pid' ),
				'utf8'
			);
			process.kill( parseInt( pid, 10 ), 0 );
			isRunning = true;
		} catch {
			// Not running.
		}

		return {
			status: isRunning ? 'running' : 'stopped',
			runtime: 'php',
			urls: {
				development: isRunning ? envConfig.config.WP_SITEURL : null,
			},
			ports: {
				development: envConfig.port,
			},
			config: {
				multisite: false,
				xdebug: 'off',
			},
			configPath: config.configDirectoryPath,
			installPath: config.workDirectoryPath,
		};
	}

	/**
	 * Show logs. Not supported yet; the server log is php/server.log in the
	 * work directory.
	 */
	async logs() {
		throw new UnsupportedCommandError( 'logs' );
	}

	/**
	 * Copy WordPress into the site folder, link the plugins, themes and
	 * mappings, install it with a SQLite database and keep a clean copy of
	 * the database for `wp-env clean`.
	 *
	 * @param {Object} config  The wp-env config object.
	 * @param {string} siteDir The site folder.
	 * @param {Object} spinner A CLI spinner which indicates progress.
	 */
	async _setUp( config, siteDir, spinner ) {
		const envConfig = config.env.development;
		const sqlite = parseSourceString( SQLITE_PLUGIN_URL, {
			cacheDirectoryPath: config.workDirectoryPath,
		} );
		const mappings = {
			'wp-content/plugins/sqlite-database-integration': sqlite,
		};
		for ( const source of envConfig.pluginSources ) {
			mappings[ `wp-content/plugins/${ source.basename }` ] = source;
		}
		for ( const source of envConfig.themeSources ) {
			mappings[ `wp-content/themes/${ source.basename }` ] = source;
		}
		Object.assign( mappings, envConfig.mappings );

		spinner.text = 'Downloading sources.';
		await Promise.all(
			[ envConfig.coreSource, ...Object.values( mappings ) ].map(
				( source ) =>
					downloadSource( source, {
						onProgress: () => {},
						spinner,
						debug: config.debug,
					} )
			)
		);

		spinner.text = 'Setting up WordPress.';
		await rimraf( siteDir );
		const databaseDir = path.dirname( getDatabasePaths( config ).database );
		await rimraf( databaseDir );
		await fs.mkdir( databaseDir, { recursive: true } );
		// A copy-on-write clone where the file system supports it.
		await fs.cp( envConfig.coreSource.path, siteDir, {
			recursive: true,
			mode: constants.COPYFILE_FICLONE,
			filter: ( source ) => path.basename( source ) !== '.git',
		} );
		await fs.copyFile(
			path.join( sqlite.path, 'db.copy' ),
			path.join( siteDir, 'wp-content/db.php' )
		);

		// Shorter paths first, so a mapping inside another one is linked
		// within it rather than in the folder it points to.
		const sorted = Object.keys( mappings ).sort(
			( a, b ) => a.length - b.length
		);
		for ( const wpPath of sorted ) {
			const target = path.join( siteDir, wpPath );
			await rimraf( target );
			await fs.mkdir( path.dirname( target ), { recursive: true } );
			if (
				sorted.some( ( other ) => other.startsWith( wpPath + '/' ) )
			) {
				await fs.mkdir( target );
				for ( const entry of await fs.readdir(
					mappings[ wpPath ].path
				) ) {
					await fs.symlink(
						path.join( mappings[ wpPath ].path, entry ),
						path.join( target, entry ),
						'junction'
					);
				}
			} else {
				await fs.symlink( mappings[ wpPath ].path, target, 'junction' );
			}
		}

		await writeWpConfig( config, siteDir );
		const install = spawn.sync(
			'php',
			[
				path.join( __dirname, 'install.php' ),
				siteDir,
				config.name,
				...envConfig.pluginSources.map( ( source ) => source.basename ),
			],
			{ encoding: 'utf8' }
		);
		if ( install.error?.code === 'ENOENT' ) {
			throw new Error(
				'PHP was not found. Install PHP or use --runtime=playground.'
			);
		}
		// WordPress errors exit with 0, but leave no database.
		const { database, clean } = getDatabasePaths( config );
		if ( install.status !== 0 || ! existsSync( database ) ) {
			throw new Error(
				`Installing WordPress failed:\n${ install.stdout }${ install.stderr }`
			);
		}

		await fs.copyFile( database, clean );
	}

	/**
	 * Wait until the server answers.
	 *
	 * @param {string} url The site URL.
	 */
	async _waitForServer( url ) {
		for ( let i = 0; i < 100; i++ ) {
			try {
				await fetch( url, { redirect: 'manual' } );
				return;
			} catch {
				await new Promise( ( resolve ) => setTimeout( resolve, 100 ) );
			}
		}
		throw new Error( `PHP did not start at ${ url } within 10 seconds.` );
	}
}

/**
 * The database and its clean copy, outside the folder the server serves.
 *
 * @param {Object} config The wp-env config object.
 * @return {Object} The database and clean copy paths.
 */
function getDatabasePaths( config ) {
	const dir = path.join( config.workDirectoryPath, 'php-database' );
	return {
		database: path.join( dir, 'wordpress.sqlite' ),
		clean: path.join( dir, 'clean.sqlite' ),
	};
}

/**
 * Write wp-config.php with the constants from the config, which include the
 * site URL and so the port.
 *
 * @param {Object} config  The wp-env config object.
 * @param {string} siteDir The site folder.
 */
async function writeWpConfig( config, siteDir ) {
	const defines = Object.entries( config.env.development.config )
		.filter( ( [ , value ] ) => value !== null )
		.map(
			( [ key, value ] ) =>
				`define( '${ key }', ${ phpValue( value ) } );`
		);
	await fs.writeFile(
		path.join( siteDir, 'wp-config.php' ),
		[
			'<?php',
			"$table_prefix = 'wp_';",
			// SQLite uses it for its MySQL emulation.
			"define( 'DB_NAME', 'wordpress' );",
			`define( 'DB_PATH', ${ phpValue(
				getDatabasePaths( config ).database
			) } );`,
			...defines,
			"require_once __DIR__ . '/wp-settings.php';",
			'',
		].join( '\n' )
	);
}

/**
 * Write a config value as a PHP literal.
 *
 * @param {string|number|boolean} value The value.
 * @return {string} The PHP literal.
 */
function phpValue( value ) {
	if ( typeof value === 'string' ) {
		return `'${ value.replace( /[\\']/g, '\\$&' ) }'`;
	}
	return String( value );
}

module.exports = PhpRuntime;
