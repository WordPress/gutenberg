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
test.describe( 'Autocomplete (@firefox, @webkit)', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await Promise.all(
			userList.map( ( user ) =>
				requestUtils.createUser( {
					email: `${ user.username }@example.com`,
					...user,
				} )
			)
		);
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.activatePlugin( 'gutenberg-test-autocompleter' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllUsers();
		await requestUtils.deactivatePlugin( 'gutenberg-test-autocompleter' );
		await requestUtils.activateTheme( 'twentytwentyone' );
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
		const [ completer, type ] = completerAndOptionType;
		test( `${ completer }: should insert ${ type }`, async ( {
			page,
			editor,
		} ) => {
			// Set up test data for each case
			const testData = {};
			if ( type === 'mention' ) {
				testData.triggerString = 'I am @da';
				testData.optionText = 'Darth Vader yourfather';
				testData.snapshot = `<!-- wp:paragraph -->
<p>I am @yourfather.</p>
<!-- /wp:paragraph -->`;
			} else if ( type === 'option' ) {
				testData.triggerString = 'I like ~s';
				testData.optionText = '🍓 Strawberry';
				testData.snapshot = `<!-- wp:paragraph -->
<p>I like 🍓.</p>
<!-- /wp:paragraph -->`;
			}

			await editor.canvas.click(
				'role=button[name="Add default block"i]'
			);
			await page.keyboard.type( testData.triggerString );
			await expect(
				page.locator( `role=option[name="${ testData.optionText }"i]` )
			).toBeVisible();
			const ariaOwns = await editor.canvas.evaluate( () => {
				return document.activeElement.getAttribute( 'aria-owns' );
			} );
			const ariaActiveDescendant = await editor.canvas.evaluate( () => {
				return document.activeElement.getAttribute(
					'aria-activedescendant'
				);
			} );
			// Ensure `aria-owns` is part of the same document and ensure the
			// selected option is equal to the active descendant.
			await expect(
				editor.canvas.locator( `#${ ariaOwns } [aria-selected="true"]` )
			).toHaveAttribute( 'id', ariaActiveDescendant );
			await page.keyboard.press( 'Enter' );
			await page.keyboard.type( '.' );

			await expect
				.poll( editor.getEditedPostContent )
				.toBe( testData.snapshot );
		} );

		test( `${ completer }: should insert ${ type } between two other words`, async ( {
			page,
			editor,
			pageUtils,
		} ) => {
			const testData = {};
			if ( type === 'mention' ) {
				testData.triggerString = '@j';
				testData.optionText = 'Jane Doe testuser';
				testData.snapshot = `<!-- wp:paragraph -->
<p>Stuck in the middle with @testuser you.</p>
<!-- /wp:paragraph -->`;
			} else if ( type === 'option' ) {
				testData.triggerString = 'a ~m';
				testData.optionText = '🥭 Mango';
				testData.snapshot = `<!-- wp:paragraph -->
<p>Stuck in the middle with a 🥭 you.</p>
<!-- /wp:paragraph -->`;
			}

			await editor.canvas.click(
				'role=button[name="Add default block"i]'
			);
			await page.keyboard.type( 'Stuck in the middle with you.' );
			await pageUtils.pressKeys( 'ArrowLeft', { times: 'you.'.length } );
			await page.keyboard.type( testData.triggerString );
			await expect(
				page.locator( `role=option[name="${ testData.optionText }"i]` )
			).toBeVisible();
			await page.keyboard.press( 'Enter' );
			await page.keyboard.type( ' ' );
			await expect
				.poll( editor.getEditedPostContent )
				.toBe( testData.snapshot );
		} );

		test( `${ completer }: should insert two subsequent ${ type }s`, async ( {
			page,
			editor,
		} ) => {
			const testData = {};
			if ( type === 'mention' ) {
				testData.firstTriggerString =
					'The two greatest hobbits, in order: @bi';
				testData.secondTriggerString = ' @fr';
				testData.firstOptionText = 'Bilbo Baggins thebetterhobbit';
				testData.secondOptionText = 'Frodo Baggins ringbearer';
				testData.snapshot = `<!-- wp:paragraph -->
<p>The two greatest hobbits, in order: @thebetterhobbit @ringbearer.</p>
<!-- /wp:paragraph -->`;
			} else if ( type === 'option' ) {
				testData.firstTriggerString = 'An awesome combination: ~m';
				testData.secondTriggerString = ' ~b';
				testData.firstOptionText = '🥭 Mango';
				testData.secondOptionText = '🫐 Blueberry';
				testData.snapshot = `<!-- wp:paragraph -->
<p>An awesome combination: 🥭 🫐.</p>
<!-- /wp:paragraph -->`;
			}

			await editor.canvas.click(
				'role=button[name="Add default block"i]'
			);
			await page.keyboard.type( testData.firstTriggerString );
			await expect(
				page.locator(
					`role=option[name="${ testData.firstOptionText }"i]`
				)
			).toBeVisible();
			await page.keyboard.press( 'Enter' );
			await page.keyboard.type( testData.secondTriggerString );
			await expect(
				page.locator(
					`role=option[name="${ testData.secondOptionText }"i]`
				)
			).toBeVisible();
			await page.keyboard.press( 'Enter' );
			await page.keyboard.type( '.' );
			await expect
				.poll( editor.getEditedPostContent )
				.toBe( testData.snapshot );
		} );

		test( `${ completer }: should allow ${ type } selection via click event`, async ( {
			page,
			editor,
		} ) => {
			const testData = {};
			if ( type === 'mention' ) {
				testData.triggerString = '@';
				testData.optionText = 'Katniss Everdeen mockingjay';
				testData.snapshot = `<!-- wp:paragraph -->
<p>@mockingjay</p>
<!-- /wp:paragraph -->`;
			} else if ( type === 'option' ) {
				testData.triggerString = '~';
				testData.optionText = '🍓 Strawberry';
				testData.snapshot = `<!-- wp:paragraph -->
<p>🍓</p>
<!-- /wp:paragraph -->`;
			}

			await editor.canvas.click(
				'role=button[name="Add default block"i]'
			);
			await page.keyboard.type( testData.triggerString );
			await expect(
				page.locator( `role=option[name="${ testData.optionText }"i]` )
			).toBeVisible();
			await page
				.locator( `role=option[name="${ testData.optionText }"i]` )
				.click();

			await expect
				.poll( editor.getEditedPostContent )
				.toBe( testData.snapshot );
		} );

		test( `${ completer }: should allow ${ type } selection via keypress event`, async ( {
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
				testData.optionText = 'Jean-Luc Picard makeitso';
				testData.snapshot = `<!-- wp:paragraph -->
<p>@makeitso</p>
<!-- /wp:paragraph -->`;
			} else if ( type === 'option' ) {
				testData.triggerString = '~';
				testData.optionText = '🍒 Cherry';
				testData.snapshot = `<!-- wp:paragraph -->
<p>🍒</p>
<!-- /wp:paragraph -->`;
			}

			await editor.canvas.click(
				'role=button[name="Add default block"i]'
			);
			await page.keyboard.type( testData.triggerString );
			await expect(
				page.locator( `role=option[name="${ testData.optionText }"i]` )
			).toBeVisible();
			await pageUtils.pressKeys( 'ArrowDown', { times: 6 } );
			await page.keyboard.press( 'Enter' );

			await expect
				.poll( editor.getEditedPostContent )
				.toBe( testData.snapshot );
		} );

		test( `${ completer }: should cancel ${ type } selection via \`Escape\` keypress event`, async ( {
			page,
			editor,
		} ) => {
			const testData = {};
			if ( type === 'mention' ) {
				testData.triggerString = 'My name is @j';
				testData.optionText = 'Jane Doe testuser';
				testData.postCompleterInput = ' ...a secret.';
				testData.snapshot = `<!-- wp:paragraph -->
<p>My name is @j ...a secret.</p>
<!-- /wp:paragraph -->`;
			} else if ( type === 'option' ) {
				testData.triggerString = 'My favorite fruit is ~a';
				testData.optionText = '🍎 Apple';
				testData.postCompleterInput =
					" ...no I changed my mind. It's mango.";
				testData.snapshot = `<!-- wp:paragraph -->
<p>My favorite fruit is ~a ...no I changed my mind. It's mango.</p>
<!-- /wp:paragraph -->`;
			}

			await editor.canvas.click(
				'role=button[name="Add default block"i]'
			);
			await page.keyboard.type( testData.triggerString );
			await expect(
				page.locator( `role=option[name="${ testData.optionText }"i]` )
			).toBeVisible();
			await page.keyboard.press( 'Escape' );
			await page.keyboard.type( testData.postCompleterInput );
			// The characters before `Escape` should remain (i.e. `~app`)
			await expect
				.poll( editor.getEditedPostContent )
				.toBe( testData.snapshot );
		} );

		// This test does not apply to user mentions, because they don't get disabled.
		if ( type !== 'mention' ) {
			test( `${ completer }: should not insert disabled ${ type }s`, async ( {
				page,
				editor,
			} ) => {
				await editor.canvas.click(
					'role=button[name="Add default block"i]'
				);
				// The 'Grapes' option is disabled in our test plugin, so it should not insert the grapes emoji
				await page.keyboard.type( 'Sorry, we are all out of ~g' );
				await expect(
					page.locator( 'role=option', { hasText: '🍇 Grape' } )
				).toBeVisible();
				await page.keyboard.press( 'Enter' );
				await page.keyboard.type( ' grapes.' );
				await expect.poll( editor.getEditedPostContent )
					.toBe( `<!-- wp:paragraph -->
<p>Sorry, we are all out of ~g grapes.</p>
<!-- /wp:paragraph -->` );
			} );
		}

		test( `${ completer }: should allow newlines after multiple ${ type } completions`, async ( {
			page,
			editor,
		} ) => {
			const testData = {};
			if ( type === 'mention' ) {
				testData.triggerString = '@bu';
				testData.optionText = 'Buddy Elf buddytheelf';
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
				testData.optionText = '🫐 Blueberry';
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

			await editor.canvas.click(
				'role=button[name="Add default block"i]'
			);

			for ( let i = 0; i < 4; i++ ) {
				await page.keyboard.type( testData.triggerString );
				await expect(
					page.locator(
						`role=option[name="${ testData.optionText }"i]`
					)
				).toBeVisible();
				await page.keyboard.press( 'Enter' );
				await page.keyboard.type( ' test' );
				await page.keyboard.press( 'Enter' );
			}

			await expect
				.poll( editor.getEditedPostContent )
				.toBe( testData.snapshot );
		} );
	} );

	// The following test concerns an infinite loop regression (https://github.com/WordPress/gutenberg/issues/41709).
	// When present, the regression will cause this test to time out.
	test( 'should insert elements from multiple completers in a single block', async ( {
		page,
		editor,
	} ) => {
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '@fr' );
		await expect(
			page.locator( 'role=option', { hasText: 'Frodo Baggins' } )
		).toBeVisible();
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( ' +bi' );
		await expect(
			page.locator( 'role=option', { hasText: 'Bilbo Baggins' } )
		).toBeVisible();
		await page.keyboard.press( 'Enter' );
		await expect.poll( editor.getEditedPostContent )
			.toBe( `<!-- wp:paragraph -->
<p>@ringbearer +thebetterhobbit</p>
<!-- /wp:paragraph -->` );
	} );

	test( 'should hide UI when selection changes (by keyboard)', async ( {
		page,
		editor,
	} ) => {
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '@fr' );
		await expect(
			page.locator( 'role=option', { hasText: 'Frodo Baggins' } )
		).toBeVisible();
		await page.keyboard.press( 'ArrowLeft' );
		await expect(
			page.locator( 'role=option', { hasText: 'Frodo Baggins' } )
		).not.toBeVisible();
	} );

	test( 'should hide UI when selection changes (by mouse)', async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '@' );
		await pageUtils.pressKeys( 'primary+b' );
		await page.keyboard.type( 'f' );
		await pageUtils.pressKeys( 'primary+b' );
		await page.keyboard.type( 'r' );
		await expect(
			page.locator( 'role=option', { hasText: 'Frodo Baggins' } )
		).toBeVisible();
		// Use the strong tag to move the selection by mouse within the mention.
		await editor.canvas.click( '[data-type="core/paragraph"] strong' );
		await expect(
			page.locator( 'role=option', { hasText: 'Frodo Baggins' } )
		).not.toBeVisible();
	} );

	test( 'should allow speaking number of initial results', async ( {
		page,
		editor,
	} ) => {
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '/' );
		await expect(
			page.locator( `role=option[name="Image"i]` )
		).toBeVisible();
		// Get the assertive live region screen reader announcement.
		await expect(
			page.getByText(
				'Initial 9 results loaded. Type to filter all available results. Use up and down arrow keys to navigate.'
			)
		).toBeVisible();

		await page.keyboard.type( 'heading' );
		await expect(
			page.locator( `role=option[name="Heading"i]` )
		).toBeVisible();
		// Get the assertive live region screen reader announcement.
		await expect(
			page.getByText(
				'2 results found, use up and down arrow keys to navigate.'
			)
		).toBeVisible();
	} );
} );
