/**
 * WordPress dependencies
 */
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
} );
