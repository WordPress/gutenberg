/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const userList = [
	{
		username: 'testuser',
		firstName: 'Jane',
		lastName: 'Doe',
		password: 'iLoVeE2EtEsTs',
	},
	{
		username: 'yourfather',
		firstName: 'Darth',
		lastName: 'Vader',
		password: 'padme123',
	},
	{
		username: 'mockingjay',
		firstName: 'Katniss',
		lastName: 'Everdeen',
		password: 'district12forlyfe',
	},
	{
		username: 'ringbearer',
		firstName: 'Frodo',
		lastName: 'Baggins',
		password: 'ep1cburgl@r',
	},
	{
		username: 'thebetterhobbit',
		firstName: 'Bilbo',
		lastName: 'Baggins',
		password: 'lostwithouts@m',
	},
	{
		username: 'makeitso',
		firstName: 'Jean-Luc',
		lastName: 'Picard',
		password: 'engagE!1',
	},
	{
		username: 'buddytheelf',
		firstName: 'Buddy',
		lastName: 'Elf',
		password: 'sm1lingsmyfavorite',
	},
];
test.describe( 'Autocomplete', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		for ( const user of userList ) {
			await requestUtils.createUser( {
				email: `${ user.username }@example.com`,
				...user,
			} );
		}
		await requestUtils.activatePlugin( 'gutenberg-test-autocompleter' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllUsers();
		await requestUtils.deactivatePlugin( 'gutenberg-test-autocompleter' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { editor } ) => {
		await editor.publishPost();
	} );

	[
		[ 'User Mention', 'mention' ],
		[ 'Custom Completer', 'option' ],
	].forEach( ( completerAndOptionType ) => {
		const [ , type ] = completerAndOptionType;
		test( `should insert ${ type }`, async ( { page, editor } ) => {
			// Set up test data for each case
			const testData = {};
			if ( type === 'mention' ) {
				testData.triggerString = 'I am @da';
				testData.optionPath = 'Darth Vader';
				testData.snapshot = `<!-- wp:paragraph -->
<p>I am @yourfather.</p>
<!-- /wp:paragraph -->`;
			} else if ( type === 'option' ) {
				testData.triggerString = 'I like ~s';
				testData.optionPath = 'Strawberry';
				testData.snapshot = `<!-- wp:paragraph -->
<p>I like 🍓.</p>
<!-- /wp:paragraph -->`;
			}

			await page.click( 'role=button[name="Add default block"i]' );
			await page.keyboard.type( testData.triggerString );
			await page.waitForXPath(
				`//button[@role="option"]${ testData.optionPath }`
			);
			await page.keyboard.press( 'Enter' );
			await page.keyboard.type( '.' );

			expect( await editor.getEditedPostContent() ).toBe(
				testData.snapshot
			);
		} );

		test( `should insert ${ type } between two other words`, async ( {
			page,
			editor,
			pageUtils,
		} ) => {
			const testData = {};
			if ( type === 'mention' ) {
				testData.triggerString = '@j';
				testData.optionPath = 'Jane Doe';
				testData.snapshot = `<!-- wp:paragraph -->
<p>Stuck in the middle with @testuser you.</p>
<!-- /wp:paragraph -->`;
			} else if ( type === 'option' ) {
				testData.triggerString = 'a ~m';
				testData.optionPath = '[text()="🥭 Mango"]';
				testData.snapshot = `<!-- wp:paragraph -->
<p>Stuck in the middle with a 🥭 you.</p>
<!-- /wp:paragraph -->`;
			}

			await page.click( 'role=button[name="Add default block"i]' );
			await page.keyboard.type( 'Stuck in the middle with you.' );
			await pageUtils.pressKeyTimes( 'ArrowLeft', 'you.'.length );
			await page.keyboard.type( testData.triggerString );
			await page.waitForXPath(
				`//button[@role="option"]${ testData.optionPath }`
			);
			await page.keyboard.press( 'Enter' );
			await page.keyboard.type( ' ' );
			expect( await editor.getEditedPostContent() ).toBe(
				testData.snapshot
			);
		} );

		test( `should insert two subsequent ${ type }s`, async ( {
			page,
			editor,
		} ) => {
			const testData = {};
			if ( type === 'mention' ) {
				testData.firstTriggerString =
					'The two greatest hobbits, in order: @bi';
				testData.secondTriggerString = ' @fr';
				testData.firstOptionPath = 'Bilbo Baggins';
				testData.secondOptionPath = 'Frodo Baggins';
				testData.snapshot = `<!-- wp:paragraph -->
<p>The two greatest hobbits, in order: @thebetterhobbit @ringbearer.</p>
<!-- /wp:paragraph -->`;
			} else if ( type === 'option' ) {
				testData.firstTriggerString = 'An awesome combination: ~m';
				testData.secondTriggerString = ' ~b';
				testData.firstOptionPath = '[text()="🥭 Mango"]';
				testData.secondOptionPath = '[text()="🫐 Blueberry"]';
				testData.snapshot = `<!-- wp:paragraph -->
<p>An awesome combination: 🥭 🫐.</p>
<!-- /wp:paragraph -->`;
			}

			await page.click( 'role=button[name="Add default block"i]' );
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
			expect( await editor.getEditedPostContent() ).toBe(
				testData.snapshot
			);
		} );

		test( `should allow ${ type } selection via click event`, async ( {
			page,
			editor,
		} ) => {
			const testData = {};
			if ( type === 'mention' ) {
				testData.triggerString = '@';
				testData.optionPath = 'Katniss Everdeen';
				testData.snapshot = `<!-- wp:paragraph -->
<p>@mockingjay</p>
<!-- /wp:paragraph -->`;
			} else if ( type === 'option' ) {
				testData.triggerString = '~';
				testData.optionPath = '[text()="🍓 Strawberry"]';
				testData.snapshot = `<!-- wp:paragraph -->
<p>🍓</p>
<!-- /wp:paragraph -->`;
			}

			await page.click( 'role=button[name="Add default block"i]' );
			await page.keyboard.type( testData.triggerString );
			const targetOption = await page.waitForXPath(
				`//button[@role="option"]${ testData.optionPath }`
			);
			await targetOption.click();

			expect( await editor.getEditedPostContent() ).toBe(
				testData.snapshot
			);
		} );

		test( `should allow ${ type } selection via keypress event`, async ( {
			page,
			editor,
			pageUtils,
		} ) => {
			const testData = {};
			// Jean-Luc is the target because user mentions will be listed alphabetically by first + last name
			// This may seem off by one, but that's only because the test site adds an `admin` user that ends up at the top of the list
			// 🍒 is the target because options are listed in the order they appear in the custom completer
			if ( type === 'mention' ) {
				testData.triggerString = '@';
				testData.optionPath = 'Jean-Luc Picard';
				testData.snapshot = `<!-- wp:paragraph -->
<p>@makeitso</p>
<!-- /wp:paragraph -->`;
			} else if ( type === 'option' ) {
				testData.triggerString = '~';
				testData.optionPath = '[text()="🍒 Cherry"]';
				testData.snapshot = `<!-- wp:paragraph -->
<p>🍒</p>
<!-- /wp:paragraph -->`;
			}

			await page.click( 'role=button[name="Add default block"i]' );
			await page.keyboard.type( testData.triggerString );
			await page.waitForXPath(
				`//button[@role="option"]${ testData.optionPath }`
			);
			await pageUtils.pressKeyTimes( 'ArrowDown', 6 );
			await page.keyboard.press( 'Enter' );

			expect( await editor.getEditedPostContent() ).toBe(
				testData.snapshot
			);
		} );

		test( `should cancel ${ type } selection via \`Escape\` keypress event`, async ( {
			page,
			editor,
		} ) => {
			const testData = {};
			if ( type === 'mention' ) {
				testData.triggerString = 'My name is @j';
				testData.optionPath = 'Jane Doe';
				testData.postCompleterInput = ' ...a secret.';
				testData.snapshot = `<!-- wp:paragraph -->
<p>My name is @j ...a secret.</p>
<!-- /wp:paragraph -->`;
			} else if ( type === 'option' ) {
				testData.triggerString = 'My favorite fruit is ~a';
				testData.optionPath = '[text()="🍎 Apple"]';
				testData.postCompleterInput =
					"...no I changed my mind. It's mango.";
				testData.snapshot = `<!-- wp:paragraph -->
<p>My favorite fruit is ~a ...no I changed my mind. It's mango.</p>
<!-- /wp:paragraph -->`;
			}

			await page.click( 'role=button[name="Add default block"i]' );
			await page.keyboard.type( testData.triggerString );
			await page.waitForXPath(
				`//button[@role="option"]${ testData.optionPath }`
			);
			await page.keyboard.press( 'Escape' );
			await page.keyboard.type( testData.postCompleterInput );
			// The characters before `Escape` should remain (i.e. `~app`)
			expect( await editor.getEditedPostContent() ).toBe(
				testData.snapshot
			);
		} );

		// This test does not apply to user mentions, because they don't get disabled.
		if ( type !== 'mention' ) {
			test( `should not insert disabled ${ type }s`, async ( {
				page,
				editor,
			} ) => {
				await page.click( 'role=button[name="Add default block"i]' );
				// The 'Grapes' option is disabled in our test plugin, so it should not insert the grapes emoji
				await page.keyboard.type( 'Sorry, we are all out of ~g' );
				await page.waitForXPath(
					'//button[@role="option"][text()="🍇 Grapes"]'
				);
				await page.keyboard.press( 'Enter' );
				await page.keyboard.type( ' grapes.' );
				expect( await editor.getEditedPostContent() ).toBe( `
					"<!-- wp:paragraph -->
					<p>Sorry, we are all out of ~g grapes.</p>
					<!-- /wp:paragraph -->"
					` );
			} );
		}

		test( `should allow newlines after multiple ${ type } completions`, async ( {
			page,
			editor,
		} ) => {
			const testData = {};
			if ( type === 'mention' ) {
				testData.triggerString = '@bu';
				testData.optionPath = 'Buddy Elf';
				testData.snapshot = `<!-- wp:paragraph -->
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
<!-- /wp:paragraph -->`;
			} else if ( type === 'option' ) {
				testData.triggerString = '~b';
				testData.optionPath = '🫐 Blueberry';
				testData.snapshot = `<!-- wp:paragraph -->
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
<!-- /wp:paragraph -->`;
			}

			await page.click( 'role=button[name="Add default block"i]' );

			for ( let i = 0; i < 4; i++ ) {
				await page.keyboard.type( testData.triggerString );
				await page.waitForXPath(
					`//button[@role="option"]${ testData.optionPath }`
				);
				await page.keyboard.press( 'Enter' );
				await page.keyboard.type( ' test' );
				await page.keyboard.press( 'Enter' );
			}

			expect( await editor.getEditedPostContent() ).toBe(
				testData.snapshot
			);
		} );
	} );

	// The following test attempts to cover an infinite loop regression (https://github.com/WordPress/gutenberg/issues/41709).
	// Unfortunately, the regression (if present) crashes the tests, as well as the editor,
	// so it's skipped for now in the hopes we can find a way around that in the future.
	// eslint-disable-next-line jest/no-disabled-tests
	test.skip( 'should insert elements from multiple completers in a single block', async ( {
		page,
		editor,
	} ) => {
		await page.click( 'role=button[name="Add default block"i]' );
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
		expect( await editor.getEditedPostContent() ).toBe( `
		"<!-- wp:paragraph -->
		<p>@ringbearer +thebetterhobbit</p>
		<!-- /wp:paragraph -->"
		` );
	} );
} );
