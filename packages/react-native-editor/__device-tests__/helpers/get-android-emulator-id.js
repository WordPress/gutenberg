/**
 * External dependencies
 */
const childProcess = require( 'child_process' );

export function getAndroidEmulatorID() {
	try {
		const adbOutput = childProcess.execSync( 'adb devices -l' ).toString();

		const lines = adbOutput
			.split( '\n' )
			.filter( ( line ) => line && line.includes( 'emulator-' ) );

		if ( lines.length === 0 ) {
			// eslint-disable-next-line no-console
			console.error( 'No available emulators found.' );
			return null;
		}
		const firstEmulatorLine = lines[ 0 ];
		// Extract device ID from the beginning of the line
		return firstEmulatorLine.split( /\s+/ )[ 0 ];
	} catch ( error ) {
		// eslint-disable-next-line no-console
		console.error(
			'Failed to fetch the first available emulator ID:',
			error.message
		);
		return null;
	}
}
