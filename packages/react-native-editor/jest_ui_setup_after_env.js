/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );
const childProcess = require( 'child_process' );

/**
 * Internal dependencies
 */
const {
	isAndroid,
	isLocalEnvironment,
} = require( './__device-tests__/helpers/utils' );

jest.setTimeout( 1000000 ); // In milliseconds.

let iOSScreenRecordingProcess;
let androidScreenRecordingProcess;

const isMacOSEnvironment = () => {
	return process.platform === 'darwin';
};

const IOS_RECORDINGS_DIR = './ios-screen-recordings';
const ANDROID_RECORDINGS_DIR = './android-screen-recordings';

const getScreenRecordingFileNameBase = ( testPath, id ) => {
	const suiteName = path.basename( testPath, '.test.js' );
	return `${ suiteName }.${ id }`;
};

let allPassed = true;

// eslint-disable-next-line jest/no-jasmine-globals, no-undef
jasmine.getEnv().addReporter( {
	specStarted: ( { testPath, id } ) => {
		if ( ! isMacOSEnvironment() ) {
			return;
		}

		const fileName =
			getScreenRecordingFileNameBase( testPath, id ) + '.mp4';

		if ( isAndroid() ) {
			if ( ! fs.existsSync( ANDROID_RECORDINGS_DIR ) ) {
				fs.mkdirSync( ANDROID_RECORDINGS_DIR );
			}

			androidScreenRecordingProcess = childProcess.spawn( 'adb', [
				'shell',
				'screenrecord',
				'--verbose',
				'--bit-rate',
				'1M',
				'--size',
				'720x1280',
				`/sdcard/${ fileName }`,
			] );

			androidScreenRecordingProcess.stderr.on( 'data', ( data ) => {
				// eslint-disable-next-line no-console
				console.log( `Android screen recording error => ${ data }` );
			} );

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

		if ( ! isMacOSEnvironment() ) {
			return;
		}

		const fileNameBase = getScreenRecordingFileNameBase( testPath, id );

		if ( isAndroid() ) {
			androidScreenRecordingProcess.kill( 'SIGINT' );
			// Wait for kill.
			childProcess.execSync( 'sleep 1' );

			try {
				childProcess.execSync(
					`adb pull /sdcard/${ fileNameBase }.mp4 ${ ANDROID_RECORDINGS_DIR }`
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

			const oldPath = `${ ANDROID_RECORDINGS_DIR }/${ fileNameBase }.mp4`;
			const newPath = `${ ANDROID_RECORDINGS_DIR }/${ fileNameBase }.${ status }.mp4`;

			if ( fs.existsSync( oldPath ) ) {
				fs.renameSync( oldPath, newPath );
			}
			return;
		}

		iOSScreenRecordingProcess.kill( 'SIGINT' );

		const oldPath = `${ IOS_RECORDINGS_DIR }/${ fileNameBase }.mp4`;
		const newPath = `${ IOS_RECORDINGS_DIR }/${ fileNameBase }.${ status }.mp4`;

		if ( fs.existsSync( oldPath ) ) {
			fs.renameSync( oldPath, newPath );
		}
	},
	suiteDone() {
		if ( ! isLocalEnvironment() ) {
			global.editorPage.sauceJobStatus( allPassed );
		}
	},
} );
