/**
 * External dependencies
 */
const { get } = require( 'https' );
const path = require( 'path' );
const fs = require( 'fs' );

/**
 * Default file output destination.
 */
const DEFAULT_OUT_FILE = path.resolve(
	__dirname,
	'../src/test/fixtures/wpt-data.json'
);

/**
 * Source test data URL.
 */
const DATA_URL =
	'https://raw.githubusercontent.com/web-platform-tests/wpt/HEAD/url/resources/urltestdata.json';

/**
 * Items to exclude from the default test data, where the test case relies on
 * an explicit `'about:blank'` base parameter provided to the constructor. The
 * test data as given does not otherwise allow for distinction between a null
 * base and base of `'about:blank'`.
 *
 * @type {string[]}
 */
const INPUT_EXCEPTIONS_ACTUAL_ABOUT_BLANK_BASE = [ '#x' ];

/**
 * Given a URL, returns promise resolving to the downloaded URL contents parsed
 * as JSON.
 *
 * @param {string} url URL to download.
 *
 * @return {Promise<*>} Promise resolving to result of parsed JSON.
 */
const fetchJSON = ( url ) =>
	new Promise( ( resolve, reject ) => {
		get( url, async ( response ) => {
			if ( response.statusCode !== 200 ) {
				return reject();
			}

			let string = '';

			for await ( const chunk of response ) {
				string += chunk.toString();
			}

			resolve( JSON.parse( string ) );
		} );
	} );

/**
 * Returns true if the given value is a test data item.
 *
 * @param {*} item Candidate to test.
 *
 * @return {boolean} Whether candidate is test data item.
 */
const isDataItem = ( item ) => item && item.input;

/**
 * Returns true if the given data item is expected to be used as the base
 * parameter of a URL constructor.
 *
 * @param {Object} item Data item to test.
 *
 * @return {boolean} Whether data item has non-default base.
 */
const hasBase = ( item ) => item.base !== 'about:blank';

/**
 * Returns true if the given data item is included in the exception set.
 *
 * @param {Object} item Data item to test.
 *
 * @return {boolean} Whether data item is exception.
 */
const isException = ( item ) =>
	INPUT_EXCEPTIONS_ACTUAL_ABOUT_BLANK_BASE.includes( item.input );

/**
 * Downloads data and writes output file.
 *
 * @param {string} [outFile] Optional output file.
 */
async function download( outFile = DEFAULT_OUT_FILE ) {
	const data = await fetchJSON( DATA_URL );

	const transformedData = data
		.filter(
			( item ) =>
				isDataItem( item ) && ! hasBase( item ) && ! isException( item )
		)
		.map( ( item ) => ( {
			input: item.input,
			failure: item.failure,
		} ) );

	const file = fs.createWriteStream( outFile );
	file.write( JSON.stringify( transformedData ) );
	file.close();
}

module.exports = download;

if ( ! module.parent ) {
	try {
		download();
	} catch ( error ) {
		process.stderr.write( error );
		process.statusCode = 1;
	}
}
