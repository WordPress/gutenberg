/**
 * External dependencies
 */
import { Clipboard } from 'react-native';
import { fireEvent, initializeEditor, waitFor } from 'test/helpers';
/**
 * WordPress dependencies
 */
import { registerCoreBlocks } from '@wordpress/block-library';
import { getBlockTypes, unregisterBlockType } from '@wordpress/blocks';

/**
 * Utility function to unregister all core block types previously registered
 * when staging the Redux Store `beforeAll` integration tests start running.
 *
 * This should probably be extracted into a utility module for future tests.
 */
const unregisterBlocks = () => {
	const blocks = getBlockTypes();

	blocks.forEach( ( { name } ) => unregisterBlockType( name ) );
};

/**
 * + Deliberately removed existing unit tests in this module for the moment
 * in order to make transitioning from `react-test-renderer` to
 * `@testing-library/react-native` easier to manage. They will either be
 * re-added in the near future, or converted to complementary integration tests.
 *
 * + Deliberately structured the test cases in "Given-When-Then (GWT) Gherkin-style."
 *
 * + Added the first test that necessitates the change for forcing auto-population
 * of URLs from the Clipboard to NOT take place when editing an `<ImageEdit/>` block.
 *
 * + Intend to parameterize the tests to see how the same tests may be leveraged
 * for other block types that have `Link Settings`, e.g., `Embed` and `Button`
 * to avoid repeating the tests for those block types.
 *
 * + Integration tests will eventually be written for various planned user
 * experience scenarios including:
 *
 * ```
 * GIVEN the Link Settings sheet displays,
 * AND the Clipboard has a URL copied,
 * THEN the `Link to` field in the Link Settings should be populated with the placeholder text, i.e., `Search or type URL`.
 *
 * GIVEN the Link Picker sheet displays,
 * AND the Clipboard has a URL copied that is different from the contents of the text input field,
 * THEN the `From Clipboard` table cell should be populated with the URL from the Clipboard.
 *
 * GIVEN the Link Picker sheet displays with the `From Clipboard` table cell,
 * WHEN the Clipboard is cleared or changed to something that is NOT a URL,
 * THEN the `From Clipboard` table cell should disappear.
 *
 * GIVEN the Link Picker sheet displays,
 * AND the contents of the Clipboard are IDENTICAL to the contents of the text input field,
 * THEN do NOT display the `From Clipboard` table cell.
 *
 * GIVEN the Link Picker sheet displays,
 * AND the `From Clipboard` table cell is pressed,
 * THEN the `Search or type URL` text input field is populated with the URL from the Clipboard,
 * AND the `Add this link` table cell is repopulated with the new URL from the Clipboard.
 * ```
 */
describe( '<ImageEdit/>', () => {
	beforeAll( () => {
		registerCoreBlocks();
	} );

	afterAll( () => {
		unregisterBlocks();
	} );

	/**
	 * GIVEN an EDITOR is displayed with an IMAGE BLOCK;
	 * GIVEN the CLIPBOARD has a URL copied;
	 * WHEN the USER selects the EDIT BUTTON on the IMAGE BLOCK;
	 */
	// eslint-disable-next-line jest/no-done-callback
	it( 'should display the LINK SETTINGS with an EMPTY LINK TO field.', async ( done ) => {
		// Arrange
		const url = 'https://tonytahmouchtest.files.wordpress.com';
		const {
			getByA11yHint,
			getByA11yLabel,
			getByText,
		} = await initializeEditor( {
			initialHtml: `
				<!-- wp:image {"id":20,"sizeSlug":"large","linkDestination":"custom"} -->
	  			<figure class="wp-block-image size-large">
					<img class="wp-image-20" src="${ url }/2021/10/img_0111-2.jpg?w=1024" alt="" />
	  			</figure>
				<!-- /wp:image -->
			`,
		} );
		Clipboard.getString.mockReturnValueOnce( url );
		// Act
		fireEvent.press(
			await waitFor( () =>
				getByA11yHint( 'Double tap and hold to edit' )
			)
		);
		fireEvent.press(
			await waitFor( () => getByA11yLabel( 'Open Settings' ) )
		);
		// Assert
		const expectation =
			'The URL from the Clipboard should NOT be displayed in the Link Settings > Link To field.';
		waitFor( () => getByText( url ), { timeout: 50, interval: 10 } )
			.then( () => done.fail( expectation ) )
			.catch( () => done() );
	} );
} );
