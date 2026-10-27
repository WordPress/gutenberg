'use strict';
const fs = require( 'fs' ).promises;
const { constants, existsSync } = require( 'fs' );
const path = require( 'path' );
const spawn = require( 'cross-spawn' );
const { rimraf } = require( 'rimraf' );
const { UnsupportedCommandError } = require( '../errors' );
const { downloadSource } = require( '../../download-sources' );
const { parseSourceString } = require( '../../config/parse-source-string' );
const { isPortAnswering } = require( '../../port-utils' );
const addOrReplacePort = require( '../../config/add-or-replace-port' );
const { didCacheChange, setCache } = require( '../../cache' );
const md5 = require( '../../md5' );

// 3.1.0 or later, for DB_PATH.
const SQLITE_PLUGIN_URL =
	'https://downloads.wordpress.org/plugin/sqlite-database-integration.3.1.1.zip';
const SQLITE_PLUGIN_PATH = 'wp-content/plugins/sqlite-database-integration';
const SETUP_CACHE_KEY = 'php_setup_checksum';

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
	 * @param {Object}  config          The wp-env config object.
	 * @param {Object}  options         Start options.
	 * @param {Object}  options.spinner A CLI spinner which indicates progress.
	 * @param {boolean} options.update  If true, update sources.
	 * @return {Promise<Object>} The start message and site URL.
	 */
	async start( config, { spinner, update } ) {
		const envConfig = config.env.development;
		const siteDir = path.join( config.workDirectoryPath, 'php' );

		if ( envConfig.multisite ) {
			throw new Error(
				'Multisite is not supported with the PHP runtime yet.'
			);
		}
		const ignored = [
			config.xdebug && config.xdebug !== 'off' && 'Xdebug',
			config.spx && config.spx !== 'off' && 'SPX',
			envConfig.phpmyadmin && 'phpMyAdmin',
			envConfig.phpVersion && '"phpVersion"',
		].filter( Boolean );
		if ( ignored.length ) {
			spinner.warn(
				`The PHP runtime does not support ${ ignored.join(
					', '
				) } yet; it uses the installed PHP as it is.`
			);
			spinner.start();
		}

		const check = spawn.sync( 'php', [
			'-r',
			"exit( extension_loaded( 'pdo_sqlite' ) ? 0 : 1 );",
		] );
		if ( check.error?.code === 'ENOENT' ) {
			throw new Error(
				'PHP was not found. Install PHP or use --runtime=playground.'
			);
		}
		if ( check.status !== 0 ) {
			throw new Error(
				"PHP's pdo_sqlite extension is missing. Turn it on in php.ini or install it."
			);
		}

		const mappings = getMappings( config );
		for ( const wpPath of Object.keys( mappings ) ) {
			// Setup replaces what is at the path, so it must stay in the site.
			const relative = path.relative(
				siteDir,
				path.join( siteDir, wpPath )
			);
			if ( ! relative || relative.startsWith( '..' ) ) {
				throw new Error(
					`The mapping "${ wpPath }" must point to a path inside WordPress.`
				);
			}
		}

		await this.stop( config, { spinner } );

		const port = envConfig.port;
		const siteUrl = envConfig.config.WP_SITEURL;
		// PHP doesn't always fail on a busy port.
		if ( await isPortAnswering( port ) ) {
			throw new Error(
				`Port ${ port } is busy. Free the port, set a different one, or enable automatic port selection with --auto-port or "autoPort": true.`
			);
		}

		// Set up again when the sources change, like the Docker runtime.
		const { workDirectoryPath } = config;
		const setupHash = md5( { core: envConfig.coreSource, mappings } );
		if (
			update ||
			( await didCacheChange( SETUP_CACHE_KEY, setupHash, {
				workDirectoryPath,
			} ) )
		) {
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
			await setUp( config, siteDir, mappings );
			await setCache( SETUP_CACHE_KEY, setupHash, {
				workDirectoryPath,
			} );
		} else {
			// The port can change between starts.
			await writeWpConfig( config, siteDir );
		}

		spinner.text = `Starting PHP on port ${ port }.`;
		await this._startServer( config );

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
		const pid = ( await getServer( config ) )?.pid;
		if ( pid && process.platform === 'win32' ) {
			// Windows has no process groups, so stop the process tree.
			spawn.sync( 'taskkill', [ '/pid', String( pid ), '/t', '/f' ] );
		} else if ( pid ) {
			try {
				// The negative PID stops the server and its workers. It keeps
				// nothing in memory, so there is no need to let it finish.
				process.kill( -pid, 'SIGKILL' );
				// Wait until they are gone, so the port is free again. Signal 0
				// only checks, and throws once no process is left.
				for ( let i = 0; i < 50; i++ ) {
					await new Promise( ( resolve ) =>
						setTimeout( resolve, 100 )
					);
					process.kill( -pid, 0 );
				}
			} catch {
				// Gone.
			}
		}
		await rimraf( getServerPaths( config ).pidFile );
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
		if ( ! existsSync( clean ) ) {
			throw new Error( 'The site is not set up yet. Start it first.' );
		}
		// Replacing the database while the server writes to it can corrupt it.
		const server = await getServer( config );
		await this.stop( config, { spinner } );
		await rimraf( [ `${ database }-wal`, `${ database }-shm` ] );
		await fs.copyFile( clean, database );
		// Plugins added to the config since installation.
		install( config, path.join( config.workDirectoryPath, 'php' ) );
		// Back on its port, which `--auto-port` may have picked.
		if ( server ) {
			await this._startServer( config, server.port );
		}
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
		// `--auto-port` can start the server on another port than the config's.
		const server = await getServer( config );

		return {
			status: server ? 'running' : 'stopped',
			runtime: 'php',
			urls: {
				development: server
					? addOrReplacePort(
							envConfig.config.WP_SITEURL,
							server.port
						)
					: null,
			},
			ports: {
				development: server?.port ?? envConfig.port,
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
	 * Show the server log. Following it is not supported yet.
	 *
	 * @param {Object} config          The wp-env config object.
	 * @param {Object} options         Logs options.
	 * @param {Object} options.spinner A CLI spinner which indicates progress.
	 */
	async logs( config, { spinner } ) {
		spinner.stop();
		const { logFile } = getServerPaths( config );
		if ( ! existsSync( logFile ) ) {
			throw new Error(
				'There is no PHP server log yet. Start the site first.'
			);
		}
		process.stdout.write( await fs.readFile( logFile ) );
	}

	/**
	 * Start the PHP built-in server in the background.
	 *
	 * @param {Object} config The wp-env config object.
	 * @param {number} port   The port to serve on.
	 */
	async _startServer( config, port = config.env.development.port ) {
		const { logFile, pidFile } = getServerPaths( config );
		const log = await fs.open( logFile, 'w' );
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
				path.join( config.workDirectoryPath, 'php' ),
				path.join( __dirname, 'router.php' ),
			],
			{
				detached: true,
				// Otherwise Windows opens a console that stops the server when closed.
				windowsHide: true,
				stdio: [ 'ignore', log.fd, log.fd ],
				// Without workers the server handles one request at a time.
				env: { PHP_CLI_SERVER_WORKERS: '8', ...process.env },
			}
		);
		child.unref();
		await log.close();
		await fs.writeFile( pidFile, `${ child.pid } ${ port }` );

		await this._waitForServer( child, logFile );
	}

	/**
	 * Wait until the server listens, or fail with its log.
	 *
	 * @param {Object} child   The server process.
	 * @param {string} logFile The server log.
	 */
	async _waitForServer( child, logFile ) {
		let exited = false;
		child.on( 'exit', () => ( exited = true ) );
		let log = '';
		for ( let i = 0; i < 100; i++ ) {
			log = await fs.readFile( logFile, 'utf8' );
			// PHP logs this once it listens, and exits if the port is busy.
			if ( log.includes( 'Development Server' ) ) {
				return;
			}
			if ( exited ) {
				break;
			}
			await new Promise( ( resolve ) => setTimeout( resolve, 100 ) );
		}
		throw new Error( `PHP did not start:\n${ log }` );
	}
}

/**
 * Build the site folder: a copy of WordPress with links to the plugins, themes
 * and mappings. The database and uploads live outside it, so building it again
 * keeps them. Install WordPress the first time, and keep a clean copy of the
 * database for `wp-env clean`.
 *
 * @param {Object} config   The wp-env config object.
 * @param {string} siteDir  The site folder.
 * @param {Object} mappings The sources to link, by path in the site.
 */
async function setUp( config, siteDir, mappings ) {
	const { database, clean } = getDatabasePaths( config );
	await fs.mkdir( path.dirname( database ), { recursive: true } );
	const uploadsDir = path.join( config.workDirectoryPath, 'php-uploads' );
	await fs.mkdir( uploadsDir, { recursive: true } );

	// Removing the folder removes the links, not what they point to.
	await rimraf( siteDir );
	// A copy-on-write clone where the file system supports it.
	const coreDir = config.env.development.coreSource.path;
	await fs.cp( coreDir, siteDir, {
		recursive: true,
		mode: constants.COPYFILE_FICLONE,
		filter: ( source ) => path.relative( coreDir, source ) !== '.git',
	} );
	// Before the mappings, so a mapping can replace it. A used core folder
	// can have its own.
	const uploads = path.join( siteDir, 'wp-content/uploads' );
	await rimraf( uploads );
	await link( uploadsDir, uploads );

	// Shorter paths first, so a mapping inside another one replaces an
	// entry of it.
	const sorted = Object.keys( mappings ).sort(
		( a, b ) => a.length - b.length
	);
	for ( const wpPath of sorted ) {
		const target = path.join( siteDir, wpPath );
		await unlinkParents( siteDir, target );
		await rimraf( target );
		await fs.mkdir( path.dirname( target ), { recursive: true } );
		await link( mappings[ wpPath ].path, target );
	}

	// After the mappings, so a mapped wp-content gets it too, without writing
	// into the mapped folder.
	const dropIn = path.join( siteDir, 'wp-content/db.php' );
	await unlinkParents( siteDir, dropIn );
	await rimraf( dropIn );
	await fs.copyFile(
		path.join( mappings[ SQLITE_PLUGIN_PATH ].path, 'db.copy' ),
		dropIn
	);

	await writeWpConfig( config, siteDir );
	install( config, siteDir );
	if ( ! existsSync( clean ) ) {
		await fs.copyFile( database, clean );
	}
}

/**
 * The sources to link into the site, by path in the site: the SQLite plugin,
 * then the plugins, themes and mappings from the config.
 *
 * @param {Object} config The wp-env config object.
 * @return {Object} The sources by path.
 */
function getMappings( config ) {
	const envConfig = config.env.development;
	const mappings = {
		[ SQLITE_PLUGIN_PATH ]: parseSourceString( SQLITE_PLUGIN_URL, {
			cacheDirectoryPath: config.workDirectoryPath,
		} ),
	};
	for ( const source of envConfig.pluginSources ) {
		mappings[ `wp-content/plugins/${ source.basename }` ] = source;
	}
	for ( const source of envConfig.themeSources ) {
		mappings[ `wp-content/themes/${ source.basename }` ] = source;
	}
	return Object.assign( mappings, envConfig.mappings );
}

/**
 * Turn linked folders on the way to a path into real folders that hold links
 * to their entries, so writing the path never changes a linked folder.
 *
 * @param {string} siteDir The site folder.
 * @param {string} target  A path in the site folder.
 */
async function unlinkParents( siteDir, target ) {
	let dir = siteDir;
	for ( const part of path
		.relative( siteDir, path.dirname( target ) )
		.split( path.sep ) ) {
		dir = path.join( dir, part );
		let linked;
		try {
			linked = await fs.readlink( dir );
		} catch {
			// Not a link.
			continue;
		}
		await fs.unlink( dir );
		await fs.mkdir( dir );
		for ( const entry of await fs.readdir( linked ) ) {
			await link( path.join( linked, entry ), path.join( dir, entry ) );
		}
	}
}

/**
 * Link a folder or file. Folders become junctions, which Windows creates
 * without special rights; other systems create a symlink either way.
 *
 * @param {string} source The folder or file to link to.
 * @param {string} target The link to create.
 */
async function link( source, target ) {
	const stats = await fs.stat( source ).catch( () => null );
	if ( ! stats?.isFile() ) {
		await fs.symlink( source, target, 'junction' );
		return;
	}
	try {
		// Junctions can't point to files.
		await fs.symlink( source, target, 'file' );
	} catch ( error ) {
		if ( error.code === 'EPERM' && process.platform === 'win32' ) {
			throw new Error(
				`Linking ${ source } needs Developer Mode on Windows. Turn it on in Settings, or map the folder that holds the file.`
			);
		}
		throw error;
	}
}

/**
 * Install WordPress if the database is empty, and activate the plugins from
 * the config.
 *
 * @param {Object} config  The wp-env config object.
 * @param {string} siteDir The site folder.
 */
function install( config, siteDir ) {
	const result = spawn.sync(
		'php',
		[
			path.join( __dirname, 'install.php' ),
			siteDir,
			config.name,
			...config.env.development.pluginSources.map(
				( source ) => source.basename
			),
		],
		{ encoding: 'utf8' }
	);
	// WordPress errors exit with 0, but leave no database.
	if (
		result.status !== 0 ||
		! existsSync( getDatabasePaths( config ).database )
	) {
		throw new Error(
			`Installing WordPress failed:\n${ result.stdout }${ result.stderr }`
		);
	}
}

/**
 * The server's PID and log files, outside the folder the server serves.
 *
 * @param {Object} config The wp-env config object.
 * @return {Object} The PID and log file paths.
 */
function getServerPaths( config ) {
	return {
		pidFile: path.join( config.workDirectoryPath, 'php-server.pid' ),
		logFile: path.join( config.workDirectoryPath, 'php-server.log' ),
	};
}

/**
 * The PID and port of this site's running server, if any.
 *
 * @param {Object} config The wp-env config object.
 * @return {Promise<{pid: number, port: number}|null>} The server, or null.
 */
async function getServer( config ) {
	// The PID, then the port.
	const saved = (
		await fs
			.readFile( getServerPaths( config ).pidFile, 'utf8' )
			.catch( () => '' )
	)
		.split( ' ' )
		.map( Number );
	const pid = saved[ 0 ];
	if ( ! pid ) {
		return null;
	}
	// After a restart, the saved PID can belong to another program, so check
	// that the process serves this site.
	if ( process.platform === 'win32' ) {
		// Reading a process's command line takes PowerShell, which is slow.
		const { stdout } = spawn.sync(
			'tasklist',
			[ '/fi', `PID eq ${ pid }`, '/fo', 'csv', '/nh' ],
			{ encoding: 'utf8' }
		);
		return /^"php/i.test( stdout ) &&
			( await isPortAnswering( saved[ 1 ] ) )
			? { pid, port: saved[ 1 ] }
			: null;
	}
	const { stdout } = spawn.sync(
		'ps',
		[ '-ww', '-o', 'args=', '-p', String( pid ) ],
		{ encoding: 'utf8' }
	);
	const siteDir = path.join( config.workDirectoryPath, 'php' );
	return stdout?.includes( siteDir ) ? { pid, port: saved[ 1 ] } : null;
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
	const defines = Object.entries( {
		// WordPress only skips updating itself when it finds .git, which the
		// copy leaves out.
		WP_AUTO_UPDATE_CORE: false,
		...config.env.development.config,
	} )
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
