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

const checkPatternExistence = async ( name, available = true ) => {
	await searchForPattern( name );
	const patternElement = await page.waitForXPath(
		`//div[@role = 'option']//div[contains(text(), '${ name }')]`,
		{ timeout: 5000, visible: available, hidden: ! available }
	);
	const patternExists = !! patternElement;
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
		await createNewPost();
	} );
	afterAll( async () => {
		await deactivatePlugin( 'gutenberg-test-allowed-patterns' );
	} );

	describe( 'Disable blocks plugin disabled', () => {
		for ( const [ patternName ] of TEST_PATTERNS ) {
			it( `should show test pattern "${ patternName }"`, async () => {
				expect( await checkPatternExistence( patternName, true ) ).toBe(
					true
				);
			} );
		}
	} );

	describe( 'Disable blocks plugin enabled', () => {
		beforeAll( async () => {
			await activatePlugin(
				'gutenberg-test-allowed-patterns-disable-blocks'
			);
			await createNewPost();
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
				expect(
					await checkPatternExistence(
						patternName,
						shouldBeAvailable
					)
				).toBe( shouldBeAvailable );
			} );
		}
	} );
} );
