/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );
const childProcess = require( 'child_process' );

/**
 * Internal dependencies
 */
const { isAndroid } = require( './__device-tests__/helpers/utils' );

jest.setTimeout( 1000000 ); // In milliseconds.

let iOSScreenRecordingProcess;
let androidScreenRecordingProcess;
let deviceID;

const isMacOSEnvironment = () => {
	return process.platform === 'darwin';
};

const IOS_RECORDINGS_DIR = './ios-screen-recordings';
const ANDROID_RECORDINGS_DIR = './android-screen-recordings';
const ANDROID_EMULATOR_DIR = '/sdcard/';

const getScreenRecordingFileNameBase = ( testPath, id ) => {
	const suiteName = path.basename( testPath, '.test.js' );
	return `${ suiteName }.${ id }`;
};

function deleteRecordingFile( filePath ) {
	if ( fs.existsSync( filePath ) ) {
		try {
			fs.unlinkSync( filePath );
		} catch ( error ) {
			// eslint-disable-next-line no-console
			console.error(
				`Failed to delete ${ filePath }. Error: ${ error.message }`
			);
		}
	}
}

async function getDeviceID() {
	try {
		const session = await global.editorPage.driver.getSession();
		return session.deviceUDID;
	} catch ( error ) {
		// eslint-disable-next-line no-console
		console.error( 'Failed to fetch the device ID:', error.message );
		return null;
	}
}

let allPassed = true;

function logAndroidError( data ) {
	// eslint-disable-next-line no-console
	console.log( `Android screen recording error => ${ data }` );
}

// Setup the listener before each test.
beforeEach( () => {
	if (
		androidScreenRecordingProcess &&
		androidScreenRecordingProcess.stderr
	) {
		androidScreenRecordingProcess.stderr.on( 'data', logAndroidError );
	}
} );

// Cleanup the listener after each test.
afterEach( () => {
	if (
		androidScreenRecordingProcess &&
		androidScreenRecordingProcess.stderr
	) {
		androidScreenRecordingProcess.stderr.removeListener(
			'data',
			logAndroidError
		);
	}
} );

// eslint-disable-next-line jest/no-jasmine-globals, no-undef
jasmine.getEnv().addReporter( {
	specStarted: async ( { testPath, id } ) => {
		if ( ! isMacOSEnvironment() ) {
			return;
		}

		deviceID = await getDeviceID();

		const fileName =
			getScreenRecordingFileNameBase( testPath, id ) + '.mp4';

		if ( isAndroid() ) {
			if ( ! fs.existsSync( ANDROID_RECORDINGS_DIR ) ) {
				fs.mkdirSync( ANDROID_RECORDINGS_DIR );
			}

			// Use the "mkdir -p" command to create the
			// ANDROID_EMULATOR_DIR directory if it doesn't exists.
			try {
				childProcess.execSync(
					`adb -s ${ deviceID } shell "mkdir -p ${ ANDROID_EMULATOR_DIR }" 2>/dev/null`
				);
			} catch ( error ) {
				// eslint-disable-next-line no-console
				console.error( `Failed to create the directory: ${ error }` );
			}

			androidScreenRecordingProcess = childProcess.spawn( 'adb', [
				'-s',
				deviceID,
				'shell',
				'screenrecord',
				'--verbose',
				'--bit-rate',
				'1M',
				'--size',
				'720x1280',
				`${ ANDROID_EMULATOR_DIR }${ fileName }`,
			] );
			return;
		}

		if ( ! fs.existsSync( IOS_RECORDINGS_DIR ) ) {
			fs.mkdirSync( IOS_RECORDINGS_DIR );
		}

		iOSScreenRecordingProcess = childProcess.spawn(
			'xcrun',
			[
				'simctl',
				'io',
				'booted',
				'recordVideo',
				'--mask=black',
				'--force',
				fileName,
			],
			{
				cwd: IOS_RECORDINGS_DIR,
			}
		);
	},
	specDone: ( { testPath, id, status } ) => {
		allPassed = allPassed && status !== 'failed';
		const isTestSkipped = status === 'pending';

		if ( ! isMacOSEnvironment() ) {
			return;
		}

		const fileNameBase = getScreenRecordingFileNameBase( testPath, id );

		if ( isAndroid() ) {
			androidScreenRecordingProcess.kill( 'SIGINT' );
			// Wait for kill.
			childProcess.execSync( 'sleep 1' );

			const recordingFilePath = `${ ANDROID_RECORDINGS_DIR }/${ fileNameBase }.mp4`;

			if ( isTestSkipped ) {
				deleteRecordingFile( recordingFilePath );
				return;
			}

			try {
				childProcess.execSync(
					`adb -s ${ deviceID } pull ${ ANDROID_EMULATOR_DIR }${ fileNameBase }.mp4 ${ ANDROID_RECORDINGS_DIR }`
				);
			} catch ( error ) {
				// Some (old) Android devices don't support screen recording or
				// sometimes the initial `should be able to see visual editor`
				// tests are too fast and a recording is not generated. This is
				// when `adb pull` can't find the recording file. In these cases
				// we ignore the errors and keep running the tests.
				// eslint-disable-next-line no-console
				console.log(
					`Android screen recording error => ${ error.stdout }`
				);
			}

			const newPath = `${ ANDROID_RECORDINGS_DIR }/${ fileNameBase }.${ status }.mp4`;

			if ( fs.existsSync( recordingFilePath ) ) {
				fs.renameSync( recordingFilePath, newPath );
			}
			return;
		}

		iOSScreenRecordingProcess.kill( 'SIGINT' );

		const recordingFilePath = `${ IOS_RECORDINGS_DIR }/${ fileNameBase }.mp4`;

		if ( isTestSkipped ) {
			deleteRecordingFile( recordingFilePath );
			return;
		}

		const newPath = `${ IOS_RECORDINGS_DIR }/${ fileNameBase }.${ status }.mp4`;

		if ( fs.existsSync( recordingFilePath ) ) {
			fs.renameSync( recordingFilePath, newPath );
		}
	},
} );
