/**
 * Internal dependencies
 */
import parseException from '../parseException';

// Mock React Native version to 0.71.2-beta-1
jest.mock( 'react-native/Libraries/Core/ReactNativeVersion', () => ( {
	version: {
		major: 0,
		minor: 71,
		patch: 2,
		prerelease: 'beta-1',
	},
} ) );

// Mock Gutenberg Mobile version to 1.100.0
jest.mock( '../../package.json', () => ( { version: '1.100.0' } ), {
	virtual: true,
} );

describe( 'Parse exception', () => {
	it( 'parses stack trace', () => {
		const rawException = {
			name: 'Error',
			message: 'Test exception',
			stack: 'TypeError: Test exception\n    at functionThatFailed (file1.native.js:546277:24)\n    at parentFunction (file2.native.js:459785:40)\n    at otherFunction (file3.native.js:62524:22)\n    at apply (native)\n    at functionThatTriggersNative (bridge.native.js:62932:21)\n    at topLevelFunction (rootFile.native.js:64215:43)\n    at forEach (native)\n    at anonymous (otherFile.native.js:64266:42)\n    at reactNativeFunction (reactNative.js:5383:21)',
		};

		expect( parseException( rawException ) ).toMatchSnapshot();
	} );

	it( 'parses Hermes stack trace', () => {
		global.HermesInternal = true;

		const rawException = {
			name: 'Error',
			message: 'Test exception',
			stack: 'TypeError: Test exception\n    at functionThatFailed (file1.native.js:1:1000)\n    at apply (native)\n    at functionThatTriggersNative (bridge.native.js:1:2000)\n    at topLevelFunction (rootFile.native.js:1:3000)',
		};

		const exception = parseException( rawException );
		// Columns are incremented by one for Hermes stack traces
		expect( exception.stacktrace[ 0 ].colno ).toBe( 3001 );
		expect( exception.stacktrace[ 1 ].colno ).toBe( 2001 );
		expect( exception.stacktrace[ 2 ].colno ).toBeUndefined();
		expect( exception.stacktrace[ 3 ].colno ).toBe( 1001 );

		global.HermesInternal = undefined;
	} );

	it( 'limits stack trace entries', () => {
		const rawException = {
			stack: [ ...Array( 100 ) ]
				.map(
					( _, index ) =>
						`\n    at function${ index } (file1.native.js:546277:${ index })`
				)
				.join( '' ),
		};
		const exception = parseException( rawException );
		expect( exception.stacktrace.length ).toBe( 50 );
	} );

	it( 'sets default error message', () => {
		const exception = parseException( {} );
		expect( exception.message ).toBe( 'No error message' );
	} );

	it( 'sets unkown error type', () => {
		const exception = parseException( {
			message: { error: { message: '' } },
		} );
		expect( exception.message ).toBe( 'Unknown error' );
	} );
} );
