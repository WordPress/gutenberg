// noinspection DuplicatedCode

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
		const expectation =
			'The LINK SETTINGS > LINK TO field should be displayed WITHOUT a URL from the CLIPBOARD.';
		const url = 'https://tonytahmouchtest.files.wordpress.com';
		const subject = await initializeEditor( { initialHtml } );
		Clipboard.getString.mockReturnValue( url );

		// Act
		try {
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
		} catch ( error ) {
			done.fail( error );
		}

		// Assert
		try {
			await waitFor( () =>
				subject.getByA11yLabel(
					`Link to, ${
						type === 'core/image' ? 'None' : 'Search or type URL'
					}`
				)
			);
			done();
		} catch ( error ) {
			done.fail( expectation );
		}
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
			const expectation =
				'The LINK SETTINGS > LINK TO > LINK SUGGESTION SHOULD suggest the URL from the CLIPBOARD, e.g.,' +
				`
					${ url }
					${ __( 'From clipboard' ) }
				`;
			const subject = await initializeEditor( { initialHtml } );
			Clipboard.getString.mockReturnValue( url );

			// Act
			try {
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
				await waitFor( () =>
					subject.getByA11yLabel(
						`Copy URL from the clipboard, ${ url }`
					)
				);
			} catch ( error ) {
				done.fail( error );
			}

			// Assert
			try {
				await waitFor( () => subject.getByText( url ) );
				await waitFor( () =>
					subject.getByText( __( 'From clipboard' ) )
				);
				done();
			} catch ( error ) {
				done.fail( expectation );
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
		const expectation =
			'The LINK SETTINGS > LINK TO > LINK SUGGESTION SHOULD NOT suggest the URL from the CLIPBOARD.';
		const url = 'tonytahmouchtest.files.wordpress.com';
		const subject = await initializeEditor( { initialHtml } );
		Clipboard.getString.mockReturnValue( url );

		// Act
		try {
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
		} catch ( error ) {
			done.fail( error );
		}

		// Assert
		waitFor(
			() => subject.getByA11yLabel( /Copy URL from the clipboard[,]/ ),
			{ timeout: 50, interval: 10 }
		)
			.then( () => done.fail( expectation ) )
			.catch( () => done() );
	} );
} );
