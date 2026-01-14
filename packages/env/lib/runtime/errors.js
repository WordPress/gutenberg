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

module.exports = {
	UnsupportedCommandError,
};
