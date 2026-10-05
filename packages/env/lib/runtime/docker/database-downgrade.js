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
 * Checks whether one `X.Y.Z` version is newer than another.
 *
 * @param {string} version        The version to check.
 * @param {string} compareVersion The version to compare against.
 *
 * @return {boolean} True when `version` is newer than `compareVersion`.
 */
function isNewerVersion( version, compareVersion ) {
	const parts = version.split( '.' ).map( Number );
	const compareParts = compareVersion.split( '.' ).map( Number );

	for ( let i = 0; i < parts.length; i++ ) {
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
		isNewerVersion( dataVersion, serverVersion )
	) {
		return { service, dataVersion, serverVersion };
	}

	return null;
}

/**
 * Looks for a database service whose data was last used by a newer MariaDB
 * version than the one it is configured to run. MariaDB cannot downgrade, so
 * such a server fails to start, and Docker only reports that a dependency
 * failed. Called after a start fails, to explain why. The services are checked
 * in parallel, since each check starts a container.
 *
 * @param {string[]} services            The database services to check.
 * @param {Object}   dockerComposeConfig Options for docker-compose.
 *
 * @return {Promise<{service: string, dataVersion: string, serverVersion: string}|null>} The first downgraded service, in the order given, or null.
 */
async function findDatabaseDowngrade( services, dockerComposeConfig ) {
	const downgrades = await Promise.all(
		services.map( ( service ) =>
			checkDatabaseDowngrade( service, dockerComposeConfig )
		)
	);

	return downgrades.find( Boolean ) ?? null;
}

module.exports = {
	findDatabaseDowngrade,
	isNewerVersion,
	parseMariaDBVersion,
};
