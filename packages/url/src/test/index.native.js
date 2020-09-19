/**
 * Internal dependencies
 */
import './index.test';

jest.mock( './fixtures/wpt-data.json', () => {
	const data = jest.requireActual( './fixtures/wpt-data.json' );

	/**
	 * Test items to exclude by input. Ideally this should be empty, but are
	 * necessary by non-spec-conformance of the Native implementations.
	 * Specifically, the React Native implementation uses an implementation of
	 * WHATWG URL without full Unicode support.
	 *
	 * @type {string[]}
	 */
	const URL_EXCEPTIONS = [
		'https://�',
		'https://%EF%BF%BD',
		'ftp://example.com%80/',
		'ftp://example.com%A0/',
		'https://example.com%80/',
		'https://example.com%A0/',
	];

	return data.filter( ( { input } ) => ! URL_EXCEPTIONS.includes( input ) );
} );
