/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	createNewPost,
	deactivatePlugin,
	searchForPattern,
	toggleGlobalBlockInserter,
} from '@wordpress/e2e-test-utils';

const isPatternAvailable = async ( name ) => {
	await searchForPattern( name );
	const elements = await page.$x(
		`//div[@role = 'option']//div[contains(text(), '${ name }')]`
	);
	const patternExists = elements.length > 0;
	await toggleGlobalBlockInserter();
	return patternExists;
};

const TEST_PATTERNS = [
	[ 'Test: Single heading', true ],
	[ 'Test: Single paragraph', false ],
	[ 'Test: Paragraph inside group', false ],
];

describe( 'Allowed Patterns', () => {
	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-allowed-patterns' );
	} );
	afterAll( async () => {
		await deactivatePlugin( 'gutenberg-test-allowed-patterns' );
	} );
	beforeEach( async () => {
		await createNewPost();
	} );

	describe( 'Disable blocks plugin disabled', () => {
		for ( const [ patternName ] of TEST_PATTERNS ) {
			it( `should show test pattern "${ patternName }"`, async () => {
				expect( await isPatternAvailable( patternName ) ).toBe( true );
			} );
		}
	} );

	describe( 'Disable blocks plugin enabled', () => {
		beforeAll( async () => {
			await activatePlugin(
				'gutenberg-test-allowed-patterns-disable-blocks'
			);
		} );
		afterAll( async () => {
			await deactivatePlugin(
				'gutenberg-test-allowed-patterns-disable-blocks'
			);
		} );

		for ( const [ patternName, shouldBeAvailable ] of TEST_PATTERNS ) {
			it( `should${
				shouldBeAvailable ? '' : ' not'
			} show test "pattern ${ patternName }"`, async () => {
				expect( await isPatternAvailable( patternName ) ).toBe(
					shouldBeAvailable
				);
			} );
		}
	} );
} );
