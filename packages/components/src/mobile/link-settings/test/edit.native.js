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
import { __ } from '@wordpress/i18n';

/**
 * TODO: Move this module to `<LinkSettings/>` since it's not specific to the <ImageEdit/> block type?
 */

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
 * This used to be an `async` function instead of an ordinary function that returns a Promise.
 * It was deliberately changed because otherwise we'd get unnecessary error logs in the console that look like this:
 * `Warning: An update to ForwardRef(NavigationContainer) inside a test was not wrapped in act(...).`
 *
 * @see https://github.com/WordPress/gutenberg/issues/35685
 *
 * Utility function to interact with the element under test to pretend that
 * the user pressed elements. This could also be possibly used for `onLayout`
 * events as well, but currently I just wrote it for redundant `onPress` events.
 * If another parameter is added, I don't see why it couldn't be used to provide
 * text as user input into text fields.
 *
 * This should probably be extracted into a utility module for future tests.
 *
 * @param {Object[]} steps   - Interaction steps to apply to the UI element under test.
 * @param {Object}   element - The UI element under test.
 * @see node_modules/@testing-library/react-native/typings/index.d.ts
 * @return {Promise<Object>} - A Promise that resolves to the original element being interacted with if all steps resolve.
 */
const interactionWithUIElement = ( steps, element ) => {
	const [ step = {}, ...rest ] = steps;
	const { find = {}, then = {} } = step;
	const { event = 'none', logBeforeEvent = false } = then;
	const toQuery = ( query ) => !! find[ query ];
	const [ query = '' ] = Object.keys( find ).filter( toQuery );
	const selector = find[ query ] || '';

	if ( logBeforeEvent ) {
		// eslint-disable-next-line no-console
		console.log( JSON.stringify( element.toJSON(), null, 1 ) );
	}

	return new Promise( ( resolve, reject ) => {
		waitFor( () => element[ query ]( selector ) )
			.then( ( subject ) => {
				if ( event !== 'none' ) {
					fireEvent[ event ]( subject );
				}
				if ( rest.length ) {
					return interactionWithUIElement( rest, element );
				}
			} )
			.then( () => resolve( element ) )
			.catch( ( { errorStep = step } ) => reject( { errorStep } ) );
	} ).catch( ( { errorStep } ) => {
		// eslint-disable-next-line no-console
		console.error(
			new Error( `
				Step:
				${ JSON.stringify( errorStep ) }

				Element:
				${ JSON.stringify( element.toJSON() ) }
			` )
		);
	} );
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
describe.each( [
	[
		{
			type: 'core/button',
			initialHtml: `
				<!-- wp:button {"style":{"border":{"radius":"5px"}}} -->
				<div class="wp-block-button">
					<a class="wp-block-button__link" style="border-radius:5px">Link</a>
				</div>
				<!-- /wp:button -->
			`,
			toJSON: () => 'core/button',
		},
	],
	[
		{
			type: 'core/image',
			initialHtml: `
				<!-- wp:image {"id":20,"sizeSlug":"large","linkDestination":"custom"} -->
				<figure class="wp-block-image size-large">
					<img class="wp-image-20" src="https://tonytahmouchtest.files.wordpress.com/2021/10/img_0111-2.jpg?w=1024" alt="" />
				</figure>
				<!-- /wp:image -->
			`,
			toJSON: () => 'core/image',
		},
	],
] )( '<LinkSettings/> from %j', ( { type, initialHtml } ) => {
	beforeAll( () => {
		registerCoreBlocks();
	} );

	afterAll( () => {
		unregisterBlocks();
	} );

	/**
	 * GIVEN an EDITOR is displayed with an EDIT IMAGE BLOCK or EDIT BUTTON BLOCK;
	 * GIVEN the CLIPBOARD has a URL copied;
	 * WHEN the USER selects the SETTINGS BUTTON on the EDIT IMAGE BLOCK or EDIT BUTTON BLOCK;
	 */
	// eslint-disable-next-line jest/no-done-callback
	it( 'should display the LINK SETTINGS with an EMPTY LINK TO field.', async ( done ) => {
		// Arrange
		const url = 'https://tonytahmouchtest.files.wordpress.com';
		const subject = await initializeEditor( { initialHtml } );
		Clipboard.getString.mockReturnValue( url );

		// Act
		const buttonBlockSelector =
			type === 'core/button' ? 'Button Block. Row 1' : undefined;
		const imageBlockSelector =
			type === 'core/image' ? 'Double tap and hold to edit' : undefined;
		await interactionWithUIElement(
			[
				{
					find: {
						getByA11yLabel: buttonBlockSelector,
						getByA11yHint: imageBlockSelector,
					},
					then: { event: 'press' },
				},
				{
					find: { getByA11yLabel: 'Open Settings' },
					then: { event: 'press' },
				},
			],
			subject
		);

		// Assert
		const expectation =
			'The URL from the Clipboard should NOT be displayed in the ' +
			'Link Settings > Link To field.';
		waitFor( () => subject.getByText( url ), {
			timeout: 50,
			interval: 10,
		} )
			.then( () => done.fail( expectation ) )
			.catch( () => done() );
	} );

	/**
	 * GIVEN a SETTINGS BOTTOM SHEET is displayed;
	 * GIVEN the CLIPBOARD has a URL copied;
	 * GIVEN the STATE has NO URL;
	 * WHEN the USER selects the LINK TO cell;
	 */
	it(
		'should display the LINK PICKER with the FROM CLIPBOARD CELL populated' +
			' with the URL from the CLIPBOARD.',
		// eslint-disable-next-line jest/no-done-callback
		async ( done ) => {
			// Arrange
			const url = 'https://tonytahmouchtest.files.wordpress.com';
			const subject = await initializeEditor( { initialHtml } );
			Clipboard.getString.mockReturnValue( url );

			// Act
			const buttonBlockSelector =
				type === 'core/button' ? 'Button Block. Row 1' : undefined;
			const imageBlockSelector =
				type === 'core/image'
					? 'Double tap and hold to edit'
					: undefined;
			await interactionWithUIElement(
				[
					{
						find: {
							getByA11yLabel: buttonBlockSelector,
							getByA11yHint: imageBlockSelector,
						},
						then: { event: 'press' },
					},
					{
						find: { getByA11yLabel: 'Open Settings' },
						then: { event: 'press' },
					},
					{
						find: { getByA11yLabel: 'Link to, Search or type URL' },
						then: { event: 'press' },
					},
					{
						find: {
							getByA11yLabel: `Copy URL from the clipboard, ${ url }`,
						},
					},
				],
				subject
			);

			// Assert
			try {
				await waitFor( () => subject.getByText( url ) );
				await waitFor( () =>
					subject.getByText( __( 'From clipboard' ) )
				);
				done();
			} catch ( error ) {
				done.fail(
					'The URL from the Clipboard SHOULD be displayed in the ' +
						'Link Settings > Link To > Clipboard Link Suggestion field like this:' +
						`
						${ url }
						${ __( 'From clipboard' ) }
						`
				);
			}
		}
	);

	/**
	 * GIVEN a SETTINGS BOTTOM SHEET is displayed;
	 * GIVEN the CLIPBOARD has a NON-URL copied;
	 * GIVEN the STATE has NO URL;
	 * WHEN the USER selects the LINK TO cell;
	 */
	// eslint-disable-next-line jest/no-done-callback
	it( 'should display the LINK PICKER with NO FROM CLIPBOARD CELL.', async ( done ) => {
		// Arrange
		const url = 'tonytahmouchtest.files.wordpress.com';
		const subject = await initializeEditor( { initialHtml } );
		Clipboard.getString.mockReturnValue( url );

		// Act
		const buttonBlockSelector =
			type === 'core/button' ? 'Button Block. Row 1' : undefined;
		const imageBlockSelector =
			type === 'core/image' ? 'Double tap and hold to edit' : undefined;
		await interactionWithUIElement(
			[
				{
					find: {
						getByA11yLabel: buttonBlockSelector,
						getByA11yHint: imageBlockSelector,
					},
					then: { event: 'press' },
				},
				{
					find: { getByA11yLabel: 'Open Settings' },
					then: { event: 'press' },
				},
				{
					find: { getByA11yLabel: 'Link to, Search or type URL' },
					then: { event: 'press' },
				},
				{ find: { getByA11yLabel: `Apply` } },
			],
			subject
		);

		// Assert
		const expectation =
			'The URL from the Clipboard should NOT be displayed in the ' +
			'Link Settings > Link To > Clipboard Link Suggestion field.';
		waitFor(
			() => subject.getByA11yLabel( /Copy URL from the clipboard[,]/ ),
			{
				timeout: 50,
				interval: 10,
			}
		)
			.then( () => done.fail( expectation ) )
			.catch( () => done() );
	} );
} );
