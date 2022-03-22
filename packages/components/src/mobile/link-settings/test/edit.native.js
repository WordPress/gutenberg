// noinspection DuplicatedCode

/**
 * External dependencies
 */
import Clipboard from '@react-native-clipboard/clipboard';
import { fireEvent, initializeEditor, waitFor } from 'test/helpers';
/**
 * WordPress dependencies
 */
import { registerCoreBlocks } from '@wordpress/block-library';
import { getBlockTypes, unregisterBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

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
 * ### TODO
 * + Try to figure out why I can't `console.log(JSON.stringify(subject.toJSON()))` anymore.
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
	it( 'should display the LINK SETTINGS with an EMPTY LINK TO field.', async () => {
		// Arrange.
		const url = 'https://tonytahmouchtest.files.wordpress.com';
		const subject = await initializeEditor( { initialHtml } );
		Clipboard.getString.mockReturnValue( url );

		// Act.
		const block = await waitFor( () =>
			subject.getByA11yLabel(
				type === 'core/image' ? /Image Block/ : /Button Block/
			)
		);
		fireEvent.press( block );
		fireEvent.press( block );
		fireEvent.press(
			await waitFor( () => subject.getByA11yLabel( 'Open Settings' ) )
		);

		// Assert.
		const linkToField = await waitFor( () =>
			subject.getByA11yLabel(
				`Link to, ${
					type === 'core/image' ? 'None' : 'Search or type URL'
				}`
			)
		);
		expect( linkToField ).toBeTruthy();
	} );

	describe( '<LinkPicker/>', () => {
		describe( 'Hide Clipboard Link Suggestion - Invalid URL in Clipboard', () => {
			/**
			 * GIVEN a SETTINGS BOTTOM SHEET is displayed;
			 * GIVEN the CLIPBOARD has a NON-URL copied;
			 * GIVEN the STATE has NO URL;
			 * WHEN the USER selects the LINK TO cell;
			 */
			it( 'should display the LINK PICKER with NO FROM CLIPBOARD CELL.', async () => {
				// Arrange.
				const url = 'tonytahmouchtest.files.wordpress.com';
				const subject = await initializeEditor( { initialHtml } );
				Clipboard.getString.mockReturnValue( url );

				// Act.
				const block = await waitFor( () =>
					subject.getByA11yLabel(
						type === 'core/image' ? /Image Block/ : /Button Block/
					)
				);
				fireEvent.press( block );
				fireEvent.press( block );
				fireEvent.press(
					await waitFor( () =>
						subject.getByA11yLabel( 'Open Settings' )
					)
				);
				fireEvent.press(
					await waitFor( () =>
						subject.getByA11yLabel(
							`Link to, ${
								type === 'core/image'
									? 'None'
									: 'Search or type URL'
							}`
						)
					)
				);
				if ( type === 'core/image' ) {
					fireEvent.press(
						await waitFor( () =>
							subject.getByA11yLabel( /Custom URL/ )
						)
					);
				}
				await waitFor( () => subject.getByA11yLabel( 'Apply' ) );

				// Assert.
				expect(
					subject.queryByA11yLabel( /Copy URL from the clipboard[,]/ )
				).toBeNull();
			} );
		} );

		describe( 'Hide Clipboard Link Suggestion - Valid and Same URL in Clipboard', () => {
			/**
			 * GIVEN a SETTINGS BOTTOM SHEET is displayed;
			 * GIVEN the CLIPBOARD has a URL copied;
			 * GIVEN the STATE has the SAME URL as the CLIPBOARD;
			 * WHEN the USER selects the LINK TO cell;
			 */
			it( 'should display the LINK PICKER with NO FROM CLIPBOARD CELL.', async () => {
				// Arrange.
				const url = 'https://tonytahmouchtest.files.wordpress.com';
				const subject = await initializeEditor( { initialHtml } );
				Clipboard.getString.mockReturnValue( url );

				// Act.
				const block = await waitFor( () =>
					subject.getByA11yLabel(
						type === 'core/image' ? /Image Block/ : /Button Block/
					)
				);
				fireEvent.press( block );
				fireEvent.press( block );
				fireEvent.press(
					await waitFor( () =>
						subject.getByA11yLabel( 'Open Settings' )
					)
				);
				fireEvent.press(
					await waitFor( () =>
						subject.getByA11yLabel(
							`Link to, ${
								type === 'core/image'
									? 'None'
									: 'Search or type URL'
							}`
						)
					)
				);
				if ( type === 'core/image' ) {
					fireEvent.press(
						await waitFor( () =>
							subject.getByA11yLabel( 'Custom URL. Empty' )
						)
					);
				}
				fireEvent.press(
					await waitFor( () =>
						subject.getByA11yLabel(
							`Copy URL from the clipboard, ${ url }`
						)
					)
				);
				fireEvent.press(
					await waitFor( () =>
						subject.getByA11yLabel(
							`Link to, ${
								type === 'core/image' ? 'Custom URL' : url
							}`
						)
					)
				);
				if ( type === 'core/image' ) {
					fireEvent.press(
						await waitFor( () =>
							subject.getByA11yLabel( `Custom URL, ${ url }` )
						)
					);
				}
				await waitFor( () => subject.getByA11yLabel( 'Apply' ) );

				// Assert.
				expect(
					subject.queryByA11yLabel( /Copy URL from the clipboard[,]/ )
				).toBeNull();
			} );
		} );

		describe( 'Show Clipboard Link Suggestion - Valid and Different URL in Clipboard', () => {
			/**
			 * GIVEN a SETTINGS BOTTOM SHEET is displayed;
			 * GIVEN the CLIPBOARD has a URL copied;
			 * GIVEN the STATE has NO URL;
			 * WHEN the USER selects the LINK TO cell;
			 */
			it(
				'should display the LINK PICKER with the FROM CLIPBOARD CELL populated' +
					' with the URL from the CLIPBOARD.',
				async () => {
					// Arrange.
					const url = 'https://tonytahmouchtest.files.wordpress.com';
					const subject = await initializeEditor( { initialHtml } );
					Clipboard.getString.mockReturnValue( url );

					// Act.
					const block = await waitFor( () =>
						subject.getByA11yLabel(
							type === 'core/image'
								? /Image Block/
								: /Button Block/
						)
					);
					fireEvent.press( block );
					fireEvent.press( block );
					fireEvent.press(
						await waitFor( () =>
							subject.getByA11yLabel( 'Open Settings' )
						)
					);
					fireEvent.press(
						await waitFor( () =>
							subject.getByA11yLabel(
								`Link to, ${
									type === 'core/image'
										? 'None'
										: 'Search or type URL'
								}`
							)
						)
					);
					if ( type === 'core/image' ) {
						fireEvent.press(
							await waitFor( () =>
								subject.getByA11yLabel( /Custom URL/ )
							)
						);
					}
					await waitFor( () =>
						subject.getByA11yLabel(
							`Copy URL from the clipboard, ${ url }`
						)
					);

					// Assert.
					const clipboardUrl = await waitFor( () =>
						subject.getByText( url )
					);
					expect( clipboardUrl ).toBeTruthy();
					const clipboardNote = await waitFor( () =>
						subject.getByText( __( 'From clipboard' ) )
					);
					expect( clipboardNote ).toBeTruthy();
				}
			);
		} );

		describe( 'Press Clipboard Link Suggestion', () => {
			/**
			 * GIVEN a LINK PICKER SHEET is displayed;
			 * GIVEN the FROM CLIPBOARD CELL is displayed;
			 * WHEN the FROM CLIPBOARD CELL is pressed;
			 */
			it(
				'should display the LINK SETTINGS with the URL from the CLIPBOARD' +
					' populated in the LINK TO field.',
				async () => {
					// Arrange.
					const url = 'https://tonytahmouchtest.files.wordpress.com';
					const subject = await initializeEditor( { initialHtml } );
					Clipboard.getString.mockReturnValue( url );

					// Act.
					const block = await waitFor( () =>
						subject.getByA11yLabel(
							type === 'core/image'
								? /Image Block/
								: /Button Block/
						)
					);
					fireEvent.press( block );
					fireEvent.press( block );
					fireEvent.press(
						await waitFor( () =>
							subject.getByA11yLabel( 'Open Settings' )
						)
					);
					fireEvent.press(
						await waitFor( () =>
							subject.getByA11yLabel(
								`Link to, ${
									type === 'core/image'
										? 'None'
										: 'Search or type URL'
								}`
							)
						)
					);
					if ( type === 'core/image' ) {
						fireEvent.press(
							await waitFor( () =>
								subject.getByA11yLabel( /Custom URL/ )
							)
						);
					}
					fireEvent.press(
						await waitFor( () =>
							subject.getByA11yLabel(
								`Copy URL from the clipboard, ${ url }`
							)
						)
					);

					// Assert.
					const linkToField = await waitFor( () =>
						subject.getByA11yLabel(
							`Link to, ${
								type === 'core/image' ? 'Custom URL' : url
							}`
						)
					);
					expect( linkToField ).toBeTruthy();
				}
			);
		} );
	} );
} );
