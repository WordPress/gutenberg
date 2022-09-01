/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	deactivatePlugin,
	createNewPost,
	createUser,
	deleteUser,
	clickBlockAppender,
	getEditedPostContent,
	pressKeyTimes,
	publishPost,
} from '@wordpress/e2e-test-utils';

const userList = [
	{ userName: 'testuser', firstName: 'Jane', lastName: 'Doe' },
	{ userName: 'yourfather', firstName: 'Darth', lastName: 'Vader' },
	{ userName: 'mockingjay', firstName: 'Katniss', lastName: 'Everdeen' },
	{ userName: 'ringbearer', firstName: 'Frodo', lastName: 'Baggins' },
	{ userName: 'thebetterhobbit', firstName: 'Bilbo', lastName: 'Baggins' },
	{ userName: 'makeitso', firstName: 'Jean-Luc', lastName: 'Picard' },
	{ userName: 'buddytheelf', firstName: 'Buddy', lastName: 'Elf' },
];

describe( 'Autocomplete', () => {
	beforeAll( async () => {
		for ( const user of userList ) {
			await createUser( user.userName, {
				firstName: user.firstName,
				lastName: user.lastName,
			} );
		}
		await activatePlugin( 'gutenberg-test-autocompleter' );
	} );

	afterAll( async () => {
		for ( const user of userList ) {
			await deleteUser( user.userName );
		}
		await deactivatePlugin( 'gutenberg-test-autocompleter' );
	} );

	beforeEach( async () => {
		await createNewPost();
	} );

	afterEach( async () => {
		await publishPost();
	} );

	describe.each( [
		[ 'User Mention', 'mention' ],
		[ 'Custom Completer', 'option' ],
	] )( '%s', ( ...completerAndOptionType ) => {
		const [ , type ] = completerAndOptionType;

		it( `should insert ${ type }`, async () => {
			// Set up test data for each case
			const testData = {};
			if ( type === 'mention' ) {
				testData.triggerString = 'I am @da';
				testData.optionPath = '//*[contains(text(),"Darth Vader")]';
				testData.snapshot = `
					"<!-- wp:paragraph -->
					<p>I am @yourfather.</p>
					<!-- /wp:paragraph -->"
					`;
			} else if ( type === 'option' ) {
				testData.triggerString = 'I like ~s';
				testData.optionPath = '[text()="🍓 Strawberry"]';
				testData.snapshot = `
					"<!-- wp:paragraph -->
					<p>I like 🍓.</p>
					<!-- /wp:paragraph -->"
					`;
			}

			await clickBlockAppender();
			await page.keyboard.type( testData.triggerString );
			await page.waitForXPath(
				`//button[@role="option"]${ testData.optionPath }`
			);
			await page.keyboard.press( 'Enter' );
			await page.keyboard.type( '.' );

			expect( await getEditedPostContent() ).toMatchInlineSnapshot(
				testData.snapshot
			);
		} );

		it( `should insert ${ type } between two other words`, async () => {
			const testData = {};
			if ( type === 'mention' ) {
				testData.triggerString = '@j';
				testData.optionPath = '//*[contains(text(),"Jane Doe")]';
				testData.snapshot = `
					"<!-- wp:paragraph -->
					<p>Stuck in the middle with @testuser you.</p>
					<!-- /wp:paragraph -->"
					`;
			} else if ( type === 'option' ) {
				testData.triggerString = 'a ~m';
				testData.optionPath = '[text()="🥭 Mango"]';
				testData.snapshot = `
					"<!-- wp:paragraph -->
					<p>Stuck in the middle with a 🥭 you.</p>
					<!-- /wp:paragraph -->"
					`;
			}

			await clickBlockAppender();
			await page.keyboard.type( 'Stuck in the middle with you.' );
			await pressKeyTimes( 'ArrowLeft', 'you.'.length );
			await page.keyboard.type( testData.triggerString );
			await page.waitForXPath(
				`//button[@role="option"]${ testData.optionPath }`
			);
			await page.keyboard.press( 'Enter' );
			await page.keyboard.type( ' ' );
			expect( await getEditedPostContent() ).toMatchInlineSnapshot(
				testData.snapshot
			);
		} );

		it( `should insert two subsequent ${ type }s`, async () => {
			const testData = {};
			if ( type === 'mention' ) {
				testData.firstTriggerString =
					'The two greatest hobbits, in order: @bi';
				testData.secondTriggerString = ' @fr';
				testData.firstOptionPath =
					'//*[contains(text(),"Bilbo Baggins")]';
				testData.secondOptionPath =
					'//*[contains(text(),"Frodo Baggins")]';
				testData.snapshot = `
					"<!-- wp:paragraph -->
					<p>The two greatest hobbits, in order: @thebetterhobbit @ringbearer.</p>
					<!-- /wp:paragraph -->"
					`;
			} else if ( type === 'option' ) {
				testData.firstTriggerString = 'An awesome combination: ~m';
				testData.secondTriggerString = ' ~b';
				testData.firstOptionPath = '[text()="🥭 Mango"]';
				testData.secondOptionPath = '[text()="🫐 Blueberry"]';
				testData.snapshot = `
					"<!-- wp:paragraph -->
					<p>An awesome combination: 🥭 🫐.</p>
					<!-- /wp:paragraph -->"
					`;
			}

			await clickBlockAppender();
			await page.keyboard.type( testData.firstTriggerString );
			await page.waitForXPath(
				`//button[@role="option"]${ testData.firstOptionPath }`
			);
			await page.keyboard.press( 'Enter' );
			await page.keyboard.type( testData.secondTriggerString );
			await page.waitForXPath(
				`//button[@role="option"]${ testData.secondOptionPath }`
			);
			await page.keyboard.press( 'Enter' );
			await page.keyboard.type( '.' );
			expect( await getEditedPostContent() ).toMatchInlineSnapshot(
				testData.snapshot
			);
		} );

		it( `should allow ${ type } selection via click event`, async () => {
			const testData = {};
			if ( type === 'mention' ) {
				testData.triggerString = '@';
				testData.optionPath =
					'//*[contains(text(),"Katniss Everdeen")]';
				testData.snapshot = `
					"<!-- wp:paragraph -->
					<p>@mockingjay</p>
					<!-- /wp:paragraph -->"
					`;
			} else if ( type === 'option' ) {
				testData.triggerString = '~';
				testData.optionPath = '[text()="🍓 Strawberry"]';
				testData.snapshot = `
					"<!-- wp:paragraph -->
					<p>🍓</p>
					<!-- /wp:paragraph -->"
					`;
			}

			await clickBlockAppender();
			await page.keyboard.type( testData.triggerString );
			const targetOption = await page.waitForXPath(
				`//button[@role="option"]${ testData.optionPath }`
			);
			await targetOption.click();

			expect( await getEditedPostContent() ).toMatchInlineSnapshot(
				testData.snapshot
			);
		} );

		it( `should allow ${ type } selection via keypress event`, async () => {
			const testData = {};
			// Jean-Luc is the target because user mentions will be listed alphabetically by first + last name
			// This may seem off by one, but that's only because the test site adds an `admin` user that ends up at the top of the list
			// 🍒 is the target because options are listed in the order they appear in the custom completer
			if ( type === 'mention' ) {
				testData.triggerString = '@';
				testData.optionPath = '//*[contains(text(),"Jean-Luc Picard")]';
				testData.snapshot = `
					"<!-- wp:paragraph -->
					<p>@makeitso</p>
					<!-- /wp:paragraph -->"
					`;
			} else if ( type === 'option' ) {
				testData.triggerString = '~';
				testData.optionPath = '[text()="🍒 Cherry"]';
				testData.snapshot = `
					"<!-- wp:paragraph -->
					<p>🍒</p>
					<!-- /wp:paragraph -->"
					`;
			}

			await clickBlockAppender();
			await page.keyboard.type( testData.triggerString );
			await page.waitForXPath(
				`//button[@role="option"]${ testData.optionPath }`
			);
			await pressKeyTimes( 'ArrowDown', 6 );
			await page.keyboard.press( 'Enter' );

			expect( await getEditedPostContent() ).toMatchInlineSnapshot(
				testData.snapshot
			);
		} );

		it( 'should cancel selection via `Escape` keypress event', async () => {
			const testData = {};
			if ( type === 'mention' ) {
				testData.triggerString = 'My name is @j';
				testData.optionPath = '//*[contains(text(),"Jane Doe")]';
				testData.postCompleterInput = ' ...a secret.';
				testData.snapshot = `
					"<!-- wp:paragraph -->
					<p>My name is @j ...a secret.</p>
					<!-- /wp:paragraph -->"
					`;
			} else if ( type === 'option' ) {
				testData.triggerString = 'My favorite fruit is ~a';
				testData.optionPath = '[text()="🍎 Apple"]';
				testData.postCompleterInput =
					" ...no I changed my mind. It's mango.";
				testData.snapshot = `
				"<!-- wp:paragraph -->
				<p>My favorite fruit is ~a ...no I changed my mind. It's mango.</p>
				<!-- /wp:paragraph -->"
				`;
			}

			await clickBlockAppender();
			await page.keyboard.type( testData.triggerString );
			await page.waitForXPath(
				`//button[@role="option"]${ testData.optionPath }`
			);
			await page.keyboard.press( 'Escape' );
			await page.keyboard.type( testData.postCompleterInput );
			// The characters before `Escape` should remain (i.e. `~app`)
			expect( await getEditedPostContent() ).toMatchInlineSnapshot(
				testData.snapshot
			);
		} );

		// This test does not apply to user mentions, because they don't get disabled.
		if ( type !== 'mention' ) {
			it( `should not insert disabled ${ type }s`, async () => {
				await clickBlockAppender();
				// The 'Grapes' option is disabled in our test plugin, so it should not insert the grapes emoji
				await page.keyboard.type( 'Sorry, we are all out of ~g' );
				await page.waitForXPath(
					'//button[@role="option"][text()="🍇 Grapes"]'
				);
				await page.keyboard.press( 'Enter' );
				await page.keyboard.type( ' grapes.' );
				expect( await getEditedPostContent() ).toMatchInlineSnapshot( `
					"<!-- wp:paragraph -->
					<p>Sorry, we are all out of ~g grapes.</p>
					<!-- /wp:paragraph -->"
					` );
			} );
		}

		it( 'should allow newlines after multiple completions', async () => {
			const testData = {};
			if ( type === 'mention' ) {
				testData.triggerString = '@bu';
				testData.optionPath = '//*[contains(text(),"Buddy Elf")]';
				testData.snapshot = `
					"<!-- wp:paragraph -->
					<p>@buddytheelf test</p>
					<!-- /wp:paragraph -->

					<!-- wp:paragraph -->
					<p>@buddytheelf test</p>
					<!-- /wp:paragraph -->

					<!-- wp:paragraph -->
					<p>@buddytheelf test</p>
					<!-- /wp:paragraph -->

					<!-- wp:paragraph -->
					<p>@buddytheelf test</p>
					<!-- /wp:paragraph -->

					<!-- wp:paragraph -->
					<p></p>
					<!-- /wp:paragraph -->"
					`;
			} else if ( type === 'option' ) {
				testData.triggerString = '~b';
				testData.optionPath = '[text()="🫐 Blueberry"]';
				testData.snapshot = `
					"<!-- wp:paragraph -->
					<p>🫐 test</p>
					<!-- /wp:paragraph -->

					<!-- wp:paragraph -->
					<p>🫐 test</p>
					<!-- /wp:paragraph -->

					<!-- wp:paragraph -->
					<p>🫐 test</p>
					<!-- /wp:paragraph -->

					<!-- wp:paragraph -->
					<p>🫐 test</p>
					<!-- /wp:paragraph -->

					<!-- wp:paragraph -->
					<p></p>
					<!-- /wp:paragraph -->"
					`;
			}

			await clickBlockAppender();

			for ( let i = 0; i < 4; i++ ) {
				await page.keyboard.type( testData.triggerString );
				await page.waitForXPath(
					`//button[@role="option"]${ testData.optionPath }`
				);
				await page.keyboard.press( 'Enter' );
				await page.keyboard.type( ' test' );
				await page.keyboard.press( 'Enter' );
			}

			expect( await getEditedPostContent() ).toMatchInlineSnapshot(
				testData.snapshot
			);
		} );
	} );

	// The following test attempts to cover an infinite loop regression (https://github.com/WordPress/gutenberg/issues/41709).
	// Unfortunately, the regression (if present) crashes the tests, as well as the editor,
	// so it's skipped for now in the hopes we can find a way around that in the future.
	// eslint-disable-next-line jest/no-disabled-tests
	it.skip( 'should insert elements from multiple completers in a single block', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '@fr' );
		await page.waitForXPath(
			'//button[@role="option"]//*[contains(text(),"Frodo Baggins")]'
		);
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( ' +bi' );
		await page.waitForXPath(
			'//button[@role="option"]//*[contains(text(),"Bilbo Baggins")]'
		);
		await page.keyboard.press( 'Enter' );
		expect( await getEditedPostContent() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph -->
		<p>@ringbearer +thebetterhobbit</p>
		<!-- /wp:paragraph -->"
		` );
	} );
} );
