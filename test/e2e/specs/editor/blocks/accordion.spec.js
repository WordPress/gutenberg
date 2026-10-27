const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Accordion', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should open by default when openByDefault is true', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/accordion',
			innerBlocks: [
				{
					name: 'core/accordion-item',
					attributes: { openByDefault: true },
					innerBlocks: [
						{
							name: 'core/accordion-heading',
							attributes: { title: 'Accordion Title' },
						},
						{
							name: 'core/accordion-panel',
							innerBlocks: [
								{
									name: 'core/paragraph',
									attributes: {
										content: 'Accordion Panel Content',
									},
								},
							],
						},
					],
				},
			],
		} );

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		const accordionToggle = page.getByRole( 'button', {
			name: 'Accordion Title',
		} );
		await expect( accordionToggle ).toHaveAttribute(
			'aria-expanded',
			'true'
		);
		const accordionPanel = page.getByRole( 'region', {
			name: 'Accordion Title',
		} );
		await expect( accordionPanel ).toBeVisible();
	} );

	test( 'should close other accordion items when autoclose is true', async ( {
		editor,
		page,
	} ) => {
		const accordionItems = Array.from( { length: 2 }, ( _, index ) => ( {
			name: 'core/accordion-item',
			// Open the first accordion item by default
			attributes: { openByDefault: index === 0 },
			innerBlocks: [
				{
					name: 'core/accordion-heading',
					attributes: { title: `Accordion Title ${ index + 1 }` },
				},
				{
					name: 'core/accordion-panel',
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: {
								content: `Accordion Panel Content ${
									index + 1
								}`,
							},
						},
					],
				},
			],
		} ) );

		await editor.insertBlock( {
			name: 'core/accordion',
			attributes: { autoclose: true },
			innerBlocks: accordionItems,
		} );

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		const firstAccordionToggle = page.getByRole( 'button', {
			name: 'Accordion Title 1',
		} );
		const firstAccordionPanel = page.getByRole( 'region', {
			name: 'Accordion Title 1',
		} );
		const secondAccordionToggle = page.getByRole( 'button', {
			name: 'Accordion Title 2',
		} );
		const secondAccordionPanel = page.getByRole( 'region', {
			name: 'Accordion Title 2',
		} );

		// Check that the first accordion item is open and the second is closed
		await expect( firstAccordionToggle ).toHaveAttribute(
			'aria-expanded',
			'true'
		);
		await expect( secondAccordionToggle ).toHaveAttribute(
			'aria-expanded',
			'false'
		);
		await expect( firstAccordionPanel ).toBeVisible();
		await expect( secondAccordionPanel ).toBeHidden();

		// Click the second accordion item
		await secondAccordionToggle.click();

		// Check that the first accordion item is closed and the second is open
		await expect( firstAccordionToggle ).toHaveAttribute(
			'aria-expanded',
			'false'
		);
		await expect( firstAccordionPanel ).toBeHidden();
		await expect( secondAccordionToggle ).toHaveAttribute(
			'aria-expanded',
			'true'
		);
		await expect( secondAccordionPanel ).toBeVisible();
	} );

	test( 'should open accordion panel by default when it contains the URL hash target', async ( {
		editor,
		page,
	} ) => {
		// Insert a tall spacer block to ensure anchor scrolling behaves as expected.
		await editor.insertBlock( {
			name: 'core/spacer',
			attributes: { height: '1000px' },
		} );
		await editor.insertBlock( {
			name: 'core/accordion',
			innerBlocks: [
				{
					name: 'core/accordion-item',
					innerBlocks: [
						{
							name: 'core/accordion-heading',
							attributes: { title: 'Accordion Title' },
						},
						{
							name: 'core/accordion-panel',
							innerBlocks: [
								{
									name: 'core/paragraph',
									attributes: {
										anchor: 'target',
										content: 'Accordion Panel Content',
									},
								},
							],
						},
					],
				},
			],
		} );
		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }#target` );

		const accordionPanel = page.getByRole( 'region', {
			name: 'Accordion Title',
		} );
		await expect( accordionPanel ).toBeVisible();
		const targetParagraph = page.locator( '#target' );
		await expect( targetParagraph ).toBeInViewport();
	} );

	test( 'should open accordion panel when clicking a link whose target is inside the panel', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content:
					'<a href="#target">Open panel and scroll to target</a>',
			},
		} );
		// Insert a tall spacer block to ensure anchor scrolling behaves as expected.
		await editor.insertBlock( {
			name: 'core/spacer',
			attributes: { height: '1000px' },
		} );
		await editor.insertBlock( {
			name: 'core/accordion',
			innerBlocks: [
				{
					name: 'core/accordion-item',
					innerBlocks: [
						{
							name: 'core/accordion-heading',
							attributes: { title: 'Accordion Title' },
						},
						{
							name: 'core/accordion-panel',
							innerBlocks: [
								{
									name: 'core/paragraph',
									attributes: {
										anchor: 'target',
										content: 'Accordion Panel Content',
									},
								},
							],
						},
					],
				},
			],
		} );
		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		const link = page.getByRole( 'link', {
			name: 'Open panel and scroll to target',
		} );
		const accordionPanel = page.getByRole( 'region', {
			name: 'Accordion Title',
		} );
		const targetParagraph = page.locator( '#target' );

		await expect( accordionPanel ).toBeHidden();
		await link.click();
		await expect( accordionPanel ).toBeVisible();
		await expect( targetParagraph ).toBeInViewport();
	} );

	test( 'should render and swap state-aware custom icons on the front end', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/accordion',
			innerBlocks: [
				{
					name: 'core/accordion-item',
					innerBlocks: [
						{
							name: 'core/accordion-heading',
							attributes: {
								title: 'Accordion Title',
								icon: 'core/chevron-down',
								iconStates: {
									expanded: 'core/chevron-up',
								},
							},
						},
						{
							name: 'core/accordion-panel',
							innerBlocks: [
								{
									name: 'core/paragraph',
									attributes: {
										content: 'Accordion Panel Content',
									},
								},
							],
						},
					],
				},
			],
		} );

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		const accordionToggle = page.getByRole( 'button', {
			name: 'Accordion Title',
		} );
		const iconSlot = accordionToggle.locator(
			'.wp-block-accordion-heading__toggle-icon'
		);

		// While the item is closed, the resting icon is visible and the
		// expanded icon is not rendered.
		await expect(
			iconSlot.locator( '[data-icon-state="rest"] svg' )
		).toBeVisible();
		await expect(
			iconSlot.locator( '[data-icon-state="expanded"]' )
		).toBeHidden();

		// Opening the item swaps to the expanded icon.
		await accordionToggle.click();
		await expect( accordionToggle ).toHaveAttribute(
			'aria-expanded',
			'true'
		);
		await expect(
			iconSlot.locator( '[data-icon-state="expanded"] svg' )
		).toBeVisible();
		await expect(
			iconSlot.locator( '[data-icon-state="rest"]' )
		).toBeHidden();

		// Closing the item swaps back to the resting icon.
		await accordionToggle.click();
		await expect( accordionToggle ).toHaveAttribute(
			'aria-expanded',
			'false'
		);
		await expect(
			iconSlot.locator( '[data-icon-state="rest"] svg' )
		).toBeVisible();
		await expect(
			iconSlot.locator( '[data-icon-state="expanded"]' )
		).toBeHidden();
	} );

	test( 'should allow choosing state-aware icons from the icon library', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/accordion',
			innerBlocks: [
				{
					name: 'core/accordion-item',
					innerBlocks: [
						{
							name: 'core/accordion-heading',
							attributes: { title: 'Accordion Title' },
						},
						{
							name: 'core/accordion-panel',
							innerBlocks: [
								{
									name: 'core/paragraph',
									attributes: {
										content: 'Accordion Panel Content',
									},
								},
							],
						},
					],
				},
			],
		} );

		// Select the heading block and open its settings.
		await editor.canvas
			.getByRole( 'button', { name: 'Accordion Title' } )
			.click();
		await editor.openDocumentSettingsSidebar();

		// Pick the resting icon.
		await page.getByRole( 'button', { name: /Choose icon/ } ).click();
		const gridItems = page.locator(
			'.wp-block-icon__inserter-grid-icons-list-item'
		);
		await expect( gridItems.first() ).toBeVisible();
		await gridItems.first().click();

		// The resting picker now shows Replace and the expanded picker
		// appears; pick a different icon for the expanded state.
		await expect(
			page.getByRole( 'button', { name: /: Replace/ } )
		).toBeVisible();
		await page.getByRole( 'button', { name: /: Choose icon/ } ).click();
		await expect( gridItems.first() ).toBeVisible();
		await gridItems.nth( 1 ).click();

		const content = await editor.getEditedPostContent();
		expect( content ).toContain( '"icon":"core/' );
		expect( content ).toContain( '"iconStates"' );
		expect( content ).toContain(
			'wp-block-accordion-heading__toggle-icon is-stateful'
		);
		expect( content ).toContain( '<span data-icon-state="rest"></span>' );
		expect( content ).toContain(
			'<span data-icon-state="expanded"></span>'
		);
	} );
} );
