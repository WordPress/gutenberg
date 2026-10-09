'use strict';

/**
 * Error thrown when a command is not supported by the current runtime.
 */
class UnsupportedCommandError extends Error {
	constructor( command ) {
		super(
			`The '${ command }' command is not supported in the Playground runtime at the moment.`
		);
		this.name = 'UnsupportedCommandError';
	}
}

/**
 * Error thrown when the environment has not been initialized.
 */
class EnvironmentNotInitializedError extends Error {
	constructor() {
		super( 'Environment not initialized. Run `wp-env start` first.' );
		this.name = 'EnvironmentNotInitializedError';
	}
}

/**
 * Error thrown when a database cannot start because its data was last used by
 * a newer MariaDB version, which MariaDB cannot downgrade from.
 */
class DatabaseDowngradeError extends Error {
	/**
	 * @param {string} environment   The environment whose database failed, such as `development`.
	 * @param {string} dataVersion   The newest MariaDB version that has run on the data.
	 * @param {string} serverVersion The MariaDB version the environment is configured to run.
	 */
	constructor( environment, dataVersion, serverVersion ) {
		super(
			`The ${ environment } database could not start: it was last used by MariaDB ${ dataVersion }, and MariaDB ${ serverVersion } cannot run on data from a newer version. Use MariaDB ${ dataVersion } or newer, or run \`wp-env cleanup\` to start over. Cleanup removes the environment's Docker containers, volumes, and local files, not only the databases.`
		);
		this.name = 'DatabaseDowngradeError';
	}
}

module.exports = {
	UnsupportedCommandError,
	EnvironmentNotInitializedError,
	DatabaseDowngradeError,
};
