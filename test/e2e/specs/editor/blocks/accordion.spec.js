const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Accordion', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	for ( const legacy of [ false, true ] ) {
		test( `should render panels as labelled groups in ${
			legacy ? 'previously saved' : 'new'
		} accordions`, async ( { admin, editor, page, requestUtils } ) => {
			for ( const section of [ 'First section', 'Second section' ] ) {
				await editor.insertBlock( {
					name: 'core/heading',
					attributes: { content: section },
				} );
				await editor.insertBlock( {
					name: 'core/accordion',
					innerBlocks: [ 'Audience', 'Contents', 'Methods' ].map(
						( title ) => ( {
							name: 'core/accordion-item',
							innerBlocks: [
								{
									name: 'core/accordion-heading',
									attributes: { title },
								},
								{
									name: 'core/accordion-panel',
									innerBlocks: [
										{
											name: 'core/paragraph',
											attributes: {
												content: `${ section }: ${ title }`,
											},
										},
									],
								},
							],
						} )
					),
				} );
			}

			let content = await editor.getEditedPostContent();
			if ( legacy ) {
				// Reproduce the markup stored before panels used the group role.
				content = content.replaceAll(
					'role="group" class="wp-block-accordion-panel"',
					'role="region" class="wp-block-accordion-panel"'
				);
			}
			const post = await requestUtils.createPost( {
				content,
				status: 'publish',
			} );
			// Visit before opening the editor or resaving the existing content.
			await page.goto( `/?p=${ post.id }` );
			const panels = page.locator( '.wp-block-accordion-panel' );
			await expect( panels ).toHaveCount( 6 );
			await expect( page.getByRole( 'region' ) ).toHaveCount( 0 );
			const panelIds = new Set();
			for ( const panel of await panels.all() ) {
				await expect( panel ).toHaveAttribute( 'role', 'group' );
				await expect( panel ).toHaveAttribute(
					'hidden',
					'until-found'
				);
				const panelId = await panel.getAttribute( 'id' );
				panelIds.add( panelId );
				const toggle = page.locator(
					`[id="${ await panel.getAttribute( 'aria-labelledby' ) }"]`
				);
				await expect( toggle ).toHaveAttribute(
					'aria-controls',
					panelId
				);
				await expect( toggle ).toHaveAttribute(
					'aria-expanded',
					'false'
				);
				await toggle.focus();
				await page.keyboard.press( 'Enter' );
				await expect( toggle ).toHaveAttribute(
					'aria-expanded',
					'true'
				);
				await expect( panel ).not.toHaveAttribute( 'hidden' );
				await expect( panel.getByRole( 'paragraph' ) ).toBeVisible();
				await page.keyboard.press( 'Space' );
				await expect( toggle ).toHaveAttribute(
					'aria-expanded',
					'false'
				);
				await expect( panel ).toHaveAttribute(
					'hidden',
					'until-found'
				);
			}
			expect( panelIds.size ).toBe( 6 );

			await admin.visitAdminPage(
				'post.php',
				`post=${ post.id }&action=edit`
			);
			await expect(
				editor.canvas.getByText( 'Audience', { exact: true } )
			).toHaveCount( 2 );
			await expect(
				editor.canvas.getByText(
					'Block contains unexpected or invalid content.'
				)
			).toHaveCount( 0 );
			// Editing the post serializes the migrated blocks; merely opening it
			// can keep the original, unmodified post content in the editor store.
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Edited after opening the accordions.' },
			} );
			const savedContent = await editor.getEditedPostContent();
			expect( savedContent ).not.toContain( 'role="region"' );
			expect(
				savedContent.match( /class="wp-block-accordion-panel"/g )
			).toHaveLength( 6 );
			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Save', exact: true } )
				.click();
			await page
				.getByRole( 'button', { name: 'Dismiss this notice' } )
				.filter( { hasText: 'updated' } )
				.waitFor();
			await page.reload();
			await expect
				.poll( editor.getEditedPostContent )
				.toBe( savedContent );
		} );
	}

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
		const accordionPanel = page.getByRole( 'group', {
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
		const firstAccordionPanel = page.getByRole( 'group', {
			name: 'Accordion Title 1',
		} );
		const secondAccordionToggle = page.getByRole( 'button', {
			name: 'Accordion Title 2',
		} );
		const secondAccordionPanel = page.getByRole( 'group', {
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

		const accordionPanel = page.getByRole( 'group', {
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
		const accordionPanel = page.getByRole( 'group', {
			name: 'Accordion Title',
		} );
		const targetParagraph = page.locator( '#target' );

		await expect( accordionPanel ).toBeHidden();
		await link.click();
		await expect( accordionPanel ).toBeVisible();
		await expect( targetParagraph ).toBeInViewport();
	} );
} );
