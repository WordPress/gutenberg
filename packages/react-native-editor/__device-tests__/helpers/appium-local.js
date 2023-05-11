/**
 * External dependencies
 */
const childProcess = require( 'child_process' );

// Spawns an appium process.
const start = ( { port = 4723, flags = '' } ) =>
	new Promise( ( resolve, reject ) => {
		const appium = childProcess.spawn( 'appium', [
			'--port',
			port.toString(),
			'--log',
			'./appium-out.log',
			'--log-no-colors',
			'--relaxed-security', // Needed for mobile:shell commend for text entry on Android
			flags,
		] );

		let appiumOutputBuffer = '';
		let resolved = false;
		appium.stdout.on( 'data', ( data ) => {
			if ( ! resolved ) {
				appiumOutputBuffer += data.toString();
				if (
					appiumOutputBuffer.indexOf(
						'Appium REST http interface listener started'
					) >= 0
				) {
					resolved = true;
					resolve( appium );
				}
			}
		} );

		appium.on( 'close', ( code ) => {
			if ( ! resolved ) {
				reject(
					new Error( `Appium process exited with code ${ code }` )
				);
			}
		} );
	} );

const stop = async ( appium ) => {
	if ( ! appium ) {
		return;
	}
	await appium.kill( 'SIGINT' );
};

module.exports = {
	start,
	stop,
};
