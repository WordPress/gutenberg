class CLIError extends Error {
	constructor( message ) {
		super( message );
		this.name = 'CLIError';
	}
}

module.exports = CLIError;
