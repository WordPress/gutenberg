/**
 * Prints a debug message to STDOUT in non-testing environments.
 *
 * @param message The message to print.
 */
function debug( message: string ): void {
	if ( process.env.NODE_ENV !== 'test' ) {
		process.stdout.write( message + '\n' );
	}
}

export default debug;
