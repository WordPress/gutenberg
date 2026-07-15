/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const ENDPOINT = [
	'/wp/v2/block-renderer',
	`rest_route=${ encodeURIComponent( '/wp/v2/block-renderer' ) }`,
];

function defer() {
	let resolve;
	const deferred = new Promise( ( res ) => {
		resolve = res;
	} );
	deferred.resolve = resolve;
	return deferred;
}

test.describe( 'Server-side rendered block', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-server-side-rendered-block'
		);
	} );

	test.beforeEach( async ( { admin, editor } ) => {
		await admin.createNewPost();
		await editor.insertBlock( { name: 'test/server-side-rendered-block' } );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-server-side-rendered-block'
		);
	} );

	test( 'displays updated content after changing the block attributes', async ( {
		editor,
		page,
	} ) => {
		const block = editor.canvas.getByRole( 'document', {
			name: 'Block: Test Server-Side Render',
		} );

		await page.getByRole( 'spinbutton', { name: 'Count' } ).fill( '1' );
		await expect( block ).toHaveText( 'Coffee count: 1' );
	} );

	test( 'displays an error message when the server-side render request fails', async ( {
		editor,
		context,
		page,
	} ) => {
		const block = editor.canvas.getByRole( 'document', {
			name: 'Block: Test Server-Side Render',
		} );

		await expect( block ).toHaveText( 'Coffee count: 0' );

		await context.setOffline( true );
		await page.getByRole( 'spinbutton', { name: 'Count' } ).fill( '5' );

		await expect( block ).toContainText( 'Error loading block' );
	} );

	test( 'displays a special placeholder when the request returns an empty successful response', async ( {
		editor,
		page,
	} ) => {
		const block = editor.canvas.getByRole( 'document', {
			name: 'Block: Test Server-Side Render',
		} );

		await expect( block ).toHaveText( 'Coffee count: 0' );

		// Input more than maximum value to trigger empty response.
		await page.getByRole( 'spinbutton', { name: 'Count' } ).fill( '20' );
		await expect( block ).toHaveText( 'Block rendered as empty.' );
	} );

	test( 'displays previous content followed by a loading spinner after a slight delay', async ( {
		editor,
		page,
	} ) => {
		const block = editor.canvas.getByRole( 'document', {
			name: 'Block: Test Server-Side Render',
		} );
		const deferred = defer();

		await expect( block ).toHaveText( 'Coffee count: 0' );
		await page.route(
			( url ) => ENDPOINT.some( ( u ) => url.href.includes( u ) ),
			async ( route ) => {
				await deferred;
				await route.continue();
			}
		);

		await page.getByRole( 'spinbutton', { name: 'Count' } ).fill( '3' );

		await expect( block.locator( '.components-spinner' ) ).toBeVisible();
		await expect( block ).toHaveText( 'Coffee count: 0' );
		await deferred.resolve();
		await expect( block ).toHaveText( 'Coffee count: 3' );
	} );
} );

test.describe( 'PHP-only auto-register blocks', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-server-side-rendered-block'
		);
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-server-side-rendered-block'
		);
	} );

	test( 'should register blocks with autoRegister flag', async ( {
		editor,
	} ) => {
		// Block with autoRegister flag should be insertable
		await editor.insertBlock( { name: 'test/auto-register-block' } );

		const block = editor.canvas.getByText( 'Auto-register block content' );
		await expect( block ).toBeVisible();

		// Verify the auto-registered block uses API version 3
		// (minimum version set if not specified or registered with version < 3)
		const blockType = await editor.page.evaluate( () => {
			return window.wp.blocks.getBlockType( 'test/auto-register-block' );
		} );
		expect( blockType.apiVersion ).toBe( 3 );

		// Block without autoRegister flag should NOT exist in registry
		const blockExists = await editor.page.evaluate( () => {
			return (
				window.wp.blocks.getBlockType(
					'test/php-only-no-auto-register'
				) !== undefined
			);
		} );
		expect( blockExists ).toBe( false );
	} );

	test( 'should use PHP-defined metadata (title, icon, category, keywords) for auto-registered blocks', async ( {
		page,
	} ) => {
		// Open the inserter
		await page.getByRole( 'button', { name: 'Block Inserter' } ).click();

		// Search using the custom title defined in PHP
		await page
			.getByRole( 'searchbox', { name: 'Search' } )
			.fill( 'Auto Register Test Block' );

		// Verify the block appears with the custom title
		const blockOption = page.getByRole( 'option', {
			name: 'Auto Register Test Block',
		} );
		await expect( blockOption ).toBeVisible();

		// Verify block metadata is correctly set from PHP
		const blockType = await page.evaluate( () => {
			return window.wp.blocks.getBlockType( 'test/auto-register-block' );
		} );

		// These should match the PHP-defined values
		// Icon is normalized to object format by WordPress
		expect( blockType.title ).toBe( 'Auto Register Test Block' );
		expect( blockType.icon.src ).toBe( 'admin-generic' );
		expect( blockType.category ).toBe( 'widgets' );
		expect( blockType.description ).toBe(
			'A test block for auto-registration'
		);
		expect( blockType.keywords ).toContain( 'serverblock' );
		expect( blockType.keywords ).toContain( 'autotest' );
	} );

	test( 'should render server-side content for auto-registered blocks with block supports', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'test/auto-register-block',
		} );

		const block = editor.canvas.getByText( 'Auto-register block content' );
		await expect( block ).toBeVisible();

		// Verify default background value is shown
		const backgroundText = editor.canvas.getByText( 'Background: default' );
		await expect( backgroundText ).toBeVisible();

		// Verify block has proper wrapper classes
		const blockWrapper = editor.canvas.locator( '.auto-register-example' );
		await expect( blockWrapper ).toBeVisible();

		// Verify the block wrapper has the wp-block class applied
		const wpBlockClass = editor.canvas
			.locator( '.wp-block-test-auto-register-block' )
			.first();
		await expect( wpBlockClass ).toBeVisible();

		// Change the background color and get its name
		await blockWrapper.click();
		await editor.openDocumentSettingsSidebar();

		// Background color now lives in the Background panel and is hidden by
		// default for this block, so reveal it via the panel options menu.
		await page
			.getByRole( 'button', { name: 'Background options' } )
			.click();
		await page
			.getByRole( 'menuitemcheckbox', { name: 'Show Color' } )
			.click();

		const backgroundColorButton = page
			.getByRole( 'region', { name: 'Editor settings' } )
			.locator( '.components-tools-panel' )
			.filter( {
				has: page.getByRole( 'heading', { name: 'Background' } ),
			} )
			.getByRole( 'button', { name: 'Color', exact: true } );
		await backgroundColorButton.click();

		const firstColor = page.getByRole( 'option' ).first();
		const colorName = await firstColor.getAttribute( 'aria-label' );
		await firstColor.click();

		// Verify background is no longer 'default'
		await expect( backgroundText ).toBeHidden();

		// Verify the selected color appears in the block content
		const colorText = editor.canvas.getByText(
			`Background: ${ colorName.toLowerCase().replace( /\s+/g, '-' ) }`
		);
		await expect( colorText ).toBeVisible();
	} );

	test( 'should generate inspector controls from block attributes', async ( {
		editor,
		page,
	} ) => {
		// Insert the block with auto-generated controls
		await editor.insertBlock( {
			name: 'test/auto-register-with-controls',
		} );

		// Open the document settings sidebar
		await editor.openDocumentSettingsSidebar();

		// Verify auto-generated controls are present
		// String attribute → text input
		await expect( page.getByLabel( 'Title' ) ).toBeVisible();

		// Integer attribute → number input
		await expect( page.getByLabel( 'Count' ) ).toBeVisible();

		// Number attribute → number control
		await expect( page.getByLabel( 'Spacing' ) ).toBeVisible();

		// Boolean attribute → toggle/checkbox
		await expect( page.getByLabel( 'Show Emojis' ) ).toBeVisible();

		// Enum attribute → select control
		await expect(
			page.getByLabel( 'Emoji', { exact: true } )
		).toBeVisible();
	} );

	test.describe( 'with block bindings', () => {
		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activatePlugin(
				'gutenberg-test-block-bindings'
			);
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.deactivatePlugin(
				'gutenberg-test-block-bindings'
			);
		} );

		test( 'generated inspector controls should reflect bound attribute values', async ( {
			editor,
			page,
		} ) => {
			// Insert the block with bindings on multiple attributes.
			await editor.insertBlock( {
				name: 'test/auto-register-with-controls',
				attributes: {
					metadata: {
						bindings: {
							title: {
								source: 'core/post-meta',
								args: { key: 'text_custom_field' },
							},
							count: {
								source: 'core/post-meta',
								args: { key: 'integer' },
							},
							spacing: {
								source: 'core/post-meta',
								args: { key: 'number_custom_field' },
							},
							showEmojis: {
								source: 'core/post-meta',
								args: { key: 'boolean' },
							},
						},
					},
				},
			} );

			await editor.openDocumentSettingsSidebar();

			// Controls should show bound values from the source,
			// not the block attribute defaults.
			await expect( page.getByLabel( 'Title' ) ).toHaveValue(
				'Value of the text custom field'
			);
			await expect( page.getByLabel( 'Count' ) ).toHaveValue( '3' );
			await expect( page.getByLabel( 'Spacing' ) ).toHaveValue( '0.5' );
			await expect( page.getByLabel( 'Show Emojis' ) ).toBeChecked();
		} );
	} );
} );

test.describe( 'PHP-only pattern blocks', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-server-side-rendered-block'
		);
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-pattern-blocks',
		] );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-server-side-rendered-block'
		);
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test( 'a pattern without bindings is not editable', async ( {
		editor,
	} ) => {
		await editor.insertBlock( {
			name: 'test/php-only-pattern-with-callback',
		} );

		const paragraph = editor.canvas.getByText( 'Pattern content wins.' );
		await expect( paragraph ).toBeVisible();
		await expect( paragraph ).not.toHaveAttribute(
			'contenteditable',
			'true'
		);

		expect( await editor.getEditedPostContent() ).toBe(
			'<!-- wp:test/php-only-pattern-with-callback /-->'
		);
	} );

	test( 'synced: only bound fields are editable and instances save just their overrides', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'test/php-only-synced-block' } );

		const heading = editor.canvas.getByRole( 'document', {
			name: 'Block: Heading',
		} );
		await expect( heading ).toBeVisible();
		await heading.click();
		await page.keyboard.press( 'ControlOrMeta+a' );
		await page.keyboard.type( 'My own title' );

		const paragraph = editor.canvas.getByText( 'Owned by the plugin' );
		await expect( paragraph ).not.toHaveAttribute(
			'contenteditable',
			'true'
		);

		const content = await editor.getEditedPostContent();
		expect( content ).toContain( '"Title":{"content":"My own title"}' );
		expect( content ).not.toContain( 'wp-block-heading' );

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );
		const wrapper = page.locator( '.wp-block-test-php-only-synced-block' );
		await expect( wrapper.getByText( 'My own title' ) ).toBeVisible();
		await expect(
			wrapper.getByText( 'Owned by the plugin: shipped with v1.' )
		).toBeVisible();
	} );

	test( 'can reset an override in a PHP-only pattern block', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'test/php-only-synced-block' } );

		const heading = editor.canvas.getByRole( 'document', {
			name: 'Block: Heading',
		} );
		await heading.fill( 'My own title' );
		await editor.selectBlocks( heading );
		await editor.showBlockToolbar();

		const resetButton = page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Reset' } );
		await expect( resetButton ).toBeEnabled();
		await resetButton.click();

		await expect( heading ).toHaveText( 'Synced title' );
		expect( await editor.getEditedPostContent() ).toBe(
			'<!-- wp:test/php-only-synced-block /-->'
		);
	} );

	test( 'self-referencing patterns stop at the recursive block', async ( {
		editor,
		page,
	} ) => {
		await page.getByRole( 'button', { name: 'Block Inserter' } ).click();
		await page
			.getByRole( 'searchbox', { name: 'Search' } )
			.fill( 'Self-referencing PHP-only block' );

		const blockOption = page.getByRole( 'option', {
			name: 'Self-referencing PHP-only block',
			exact: true,
		} );
		await blockOption.hover();

		const preview = page
			.locator( '.block-editor-inserter__preview iframe' )
			.contentFrame();
		await expect(
			preview.getByText( 'Block cannot be rendered inside itself.' )
		).toBeVisible();

		await blockOption.click();
		await expect(
			editor.canvas.getByText( 'Before the recursive block.' )
		).toBeVisible();
		await expect(
			editor.canvas.getByText( 'Block cannot be rendered inside itself.' )
		).toBeVisible();
	} );

	test( 'a pattern replaces server rendering: the render_callback is ignored', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'test/php-only-pattern-with-callback',
		} );

		await expect(
			editor.canvas.getByText( 'Pattern content wins.' )
		).toBeVisible();

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );
		await expect( page.getByText( 'Pattern content wins.' ) ).toBeVisible();
		await expect(
			page.getByText( 'CALLBACK SHOULD NOT RENDER' )
		).toBeHidden();
	} );

	test( 'ignores saved inner content: the registration owns the structure', async ( {
		page,
		requestUtils,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Pattern block instance',
			content:
				'<!-- wp:test/php-only-pattern-with-callback --><p>INJECTED-MARKER</p><!-- /wp:test/php-only-pattern-with-callback -->',
			status: 'publish',
		} );

		await page.goto( `/?p=${ post.id }` );
		await expect( page.getByText( 'Pattern content wins.' ) ).toBeVisible();
		await expect( page.getByText( 'INJECTED-MARKER' ) ).toBeHidden();
	} );
} );
