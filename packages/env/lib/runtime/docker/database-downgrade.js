'use strict';
const { v2: dockerCompose } = require( 'docker-compose' );

/**
 * Prints the MariaDB version of the service's image, then the newest version
 * that has run on its data directory. MariaDB records that version in
 * `mariadb_upgrade_info` (`mysql_upgrade_info` before 11.0), which wp-env keeps
 * current by setting MARIADB_AUTO_UPGRADE.
 */
const READ_VERSIONS_SCRIPT =
	'printf "%s\\n" "$MARIADB_VERSION"; cat /var/lib/mysql/mariadb_upgrade_info 2> /dev/null || cat /var/lib/mysql/mysql_upgrade_info 2> /dev/null || true';

/**
 * Extracts the first `X.Y.Z` version from a string, such as `1:12.3.3+maria~ubu2404`
 * from an image's MARIADB_VERSION or `12.3.3-MariaDB` from `mariadb_upgrade_info`.
 *
 * @param {string|undefined} text The text to search.
 *
 * @return {string|null} The version, or null when there is none.
 */
function parseMariaDBVersion( text ) {
	const match = ( text || '' ).match( /(\d+)\.(\d+)\.(\d+)/ );
	return match ? match[ 0 ] : null;
}

/**
 * Checks whether one `X.Y.Z` version is a newer major or minor release than
 * another. Patch versions are ignored, since MariaDB supports downgrading
 * within the same major and minor version.
 *
 * @param {string} version        The version to check.
 * @param {string} compareVersion The version to compare against.
 *
 * @return {boolean} True when `version` is a newer major or minor release than `compareVersion`.
 */
function isNewerMinorVersion( version, compareVersion ) {
	const parts = version.split( '.' ).map( Number );
	const compareParts = compareVersion.split( '.' ).map( Number );

	for ( let i = 0; i < 2; i++ ) {
		if ( parts[ i ] !== compareParts[ i ] ) {
			return parts[ i ] > compareParts[ i ];
		}
	}

	return false;
}

/**
 * Checks whether a database service's data was last used by a newer MariaDB
 * version than the one it is configured to run.
 *
 * @param {string} service             The database service to check.
 * @param {Object} dockerComposeConfig Options for docker-compose.
 *
 * @return {Promise<{service: string, dataVersion: string, serverVersion: string}|null>} The downgrade, or null.
 */
async function checkDatabaseDowngrade( service, dockerComposeConfig ) {
	let out;
	try {
		( { out } = await dockerCompose.run(
			service,
			[ '-c', READ_VERSIONS_SCRIPT ],
			{
				...dockerComposeConfig,
				commandOptions: [ '--rm', '--no-deps', '--entrypoint', 'sh' ],
			}
		) );
	} catch {
		// The versions could not be read, so the start failure stays as is.
		return null;
	}

	const [ imageLine, ...dataLines ] = out.split( '\n' );
	const serverVersion = parseMariaDBVersion( imageLine );
	const dataVersion = parseMariaDBVersion( dataLines.join( '\n' ) );

	if (
		serverVersion &&
		dataVersion &&
		isNewerMinorVersion( dataVersion, serverVersion )
	) {
		return { service, dataVersion, serverVersion };
	}

	return null;
}

/**
 * Gets the services whose container has exited with an error, which is how a
 * database that cannot start ends up.
 *
 * @param {string[]} services            The services to check.
 * @param {Object}   dockerComposeConfig Options for docker-compose.
 *
 * @return {Promise<string[]>} The failed services, in the order given.
 */
async function getFailedServices( services, dockerComposeConfig ) {
	let out;
	try {
		// `execCompose` returns the raw output; the library's `ps` parser fails
		// on the JSON current Compose versions print.
		( { out } = await dockerCompose.execCompose(
			'ps',
			[ '--all', '--format', 'json', ...services ],
			dockerComposeConfig
		) );
	} catch {
		return [];
	}

	// Compose prints one JSON object per line, or a single array in older versions.
	const containers = out
		.split( '\n' )
		.filter( ( line ) => line.trim() )
		.flatMap( ( line ) => JSON.parse( line ) );

	return services.filter( ( service ) =>
		containers.some(
			( container ) =>
				container.Service === service &&
				container.State === 'exited' &&
				container.ExitCode !== 0
		)
	);
}

/**
 * Looks for a database service whose data was last used by a newer MariaDB
 * version than the one it is configured to run. MariaDB cannot downgrade, so
 * such a server fails to start, and Docker only reports that a dependency
 * failed. Called after a start fails, to explain why. Only database containers
 * that exited with an error are checked, so a start that failed for another
 * reason keeps its own error. They are checked in parallel, since each check
 * starts a container.
 *
 * @param {string[]} services            The database services to check.
 * @param {Object}   dockerComposeConfig Options for docker-compose.
 *
 * @return {Promise<{service: string, dataVersion: string, serverVersion: string}|null>} The first downgraded service, in the order given, or null.
 */
async function findDatabaseDowngrade( services, dockerComposeConfig ) {
	const failedServices = await getFailedServices(
		services,
		dockerComposeConfig
	);

	const downgrades = await Promise.all(
		failedServices.map( ( service ) =>
			checkDatabaseDowngrade( service, dockerComposeConfig )
		)
	);

	return downgrades.find( Boolean ) ?? null;
}

module.exports = {
	findDatabaseDowngrade,
	isNewerMinorVersion,
	parseMariaDBVersion,
};
