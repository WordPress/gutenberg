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
			`The ${ environment } database could not start: it was last used by MariaDB ${ dataVersion }, and MariaDB ${ serverVersion } cannot run on data from a newer version. Use MariaDB ${ dataVersion } or newer, or run \`wp-env cleanup\` to delete the databases and create new ones.`
		);
		this.name = 'DatabaseDowngradeError';
	}
}

/**
 * Error thrown when images the environment needs could not be pulled and are
 * not available locally, so the environment cannot start.
 */
class MissingImageError extends Error {
	/**
	 * @param {Array<{image: string, services: string[]}>} missingImages The images that are missing, with the services that use them.
	 * @param {string}                                     [details]     The output Docker reported while pulling. Its last line, which states the cause, is included.
	 */
	constructor( missingImages, details ) {
		const images = missingImages
			.map(
				( { image, services } ) =>
					`\`${ image }\` (${ services.join( ', ' ) })`
			)
			.join( ', ' );
		const isMariaDB = missingImages.some( ( { image } ) =>
			image.startsWith( 'mariadb:' )
		);

		super(
			[
				`Could not pull ${ images }, and ${
					missingImages.length === 1 ? 'it is' : 'they are'
				} not available locally.${
					isMariaDB
						? ' Check that "mariadbVersion" is a published MariaDB version, such as "10.11" or "lts".'
						: ''
				}`,
				details?.trim().split( '\n' ).pop(),
			]
				.filter( Boolean )
				.join( '\n\n' )
		);
		this.name = 'MissingImageError';
	}
}

module.exports = {
	UnsupportedCommandError,
	EnvironmentNotInitializedError,
	DatabaseDowngradeError,
	MissingImageError,
};
