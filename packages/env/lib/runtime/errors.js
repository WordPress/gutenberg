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

module.exports = {
	UnsupportedCommandError,
	EnvironmentNotInitializedError,
};
