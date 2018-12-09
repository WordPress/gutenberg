/**
 * Internal dependencies
 */
import {
	newPost,
	getEditedPostContent,
	insertBlock,
	clickBlockAppender,
	pressWithModifier,
} from '../support/utils';

describe( 'RichText', () => {
	let unsubscribes;

	beforeEach( async () => {
		unsubscribes = [];

		await newPost();
	} );

	afterEach( () => {
		unsubscribes.forEach( ( unsubscribe ) => unsubscribe() );
	} );

	it( 'should handle change in tag name gracefully', async () => {
		// Regression test: The heading block changes the tag name of its
		// RichText element. Historically this has been prone to breakage,
		// specifically in destroying / reinitializing the TinyMCE instance.
		//
		// See: https://github.com/WordPress/gutenberg/issues/3091
		await insertBlock( 'Heading' );
		await page.click( '[aria-label="Heading 3"]' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should apply formatting with access shortcut', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'test' );
		await pressWithModifier( 'primary', 'a' );
		await pressWithModifier( 'access', 'd' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should apply formatting with primary shortcut', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'test' );
		await pressWithModifier( 'primary', 'a' );
		await pressWithModifier( 'primary', 'b' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should apply formatting when selection is collapsed', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'Some ' );
		// All following characters should now be bold.
		await pressWithModifier( 'primary', 'b' );
		await page.keyboard.type( 'bold' );
		// All following characters should no longer be bold.
		await pressWithModifier( 'primary', 'b' );
		await page.keyboard.type( '.' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should transform backtick to code', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'A `backtick`' );

		expect( await getEditedPostContent() ).toMatchSnapshot();

		await pressWithModifier( 'primary', 'z' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should only mutate text data on input', async () => {
		expect.assertions( 2 );

		await clickBlockAppender();
		await page.keyboard.type( '1' );
		await pressWithModifier( 'primary', 'b' );
		await page.keyboard.type( '2' );
		await pressWithModifier( 'primary', 'b' );
		await page.keyboard.type( '3' );

		await page.evaluate( () => {
			let called;
			const { body } = document;
			const config = {
				attributes: true,
				childList: true,
				characterData: true,
				subtree: true,
			};

			const mutationObserver = new MutationObserver( ( records ) => {
				if ( called || records.length > 1 ) {
					throw new Error( 'Typing should only mutate once.' );
				}

				records.forEach( ( record ) => {
					if ( record.type !== 'characterData' ) {
						throw new Error(
							`Typing mutated more than character data: ${ record.type }`
						);
					}
				} );

				called = true;
			} );

			mutationObserver.observe( body, config );
			unsubscribes.push( () => mutationObserver.disconnect() );

			document.addEventListener( 'selectionchange', () => {
				// One selection change event is fine. This assertion exists
				// to satisfy the `expect.assertions` expected calls. It's
				// acceptable that the `selectionchange` listener not be
				// removed given that the test must fail if it never reaches
				// this point.
				expect( true ).toBe( true );

				function throwMultipleSelectionChange() {
					throw new Error( 'Typing should only emit one selection change event.' );
				}

				document.addEventListener(
					'selectionchange',
					throwMultipleSelectionChange,
					{ once: true }
				);

				unsubscribes.push( () => {
					document.removeEventListener( 'selectionchange', throwMultipleSelectionChange );
				} );
			}, { once: true } );
		} );

		await page.keyboard.type( '4' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
