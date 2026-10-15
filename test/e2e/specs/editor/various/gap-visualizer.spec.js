const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const ROW_BLOCK_CONTENT = `<!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap"},"style":{"spacing":{"blockGap":"20px"}}} -->
<div class="wp-block-group"><!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button">Button 1</a></div>
<!-- /wp:button -->
<!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button">Button 2</a></div>
<!-- /wp:button --></div>
<!-- /wp:group -->`;

const STACK_BLOCK_CONTENT = `<!-- wp:group {"layout":{"type":"flex","orientation":"vertical"},"style":{"spacing":{"blockGap":"25px"}}} -->
<div class="wp-block-group"><!-- wp:paragraph -->
<p>Stack item 1</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph -->
<p>Stack item 2</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->`;

const STACK_WITH_NESTED_ROW_CONTENT = `<!-- wp:group {"layout":{"type":"flex","orientation":"vertical"},"style":{"spacing":{"blockGap":"40px"}}} -->
<div class="wp-block-group"><!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap"},"style":{"spacing":{"blockGap":"15px"}}} -->
<div class="wp-block-group"><!-- wp:paragraph -->
<p>Row item 1</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph -->
<p>Row item 2</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->
<!-- wp:paragraph -->
<p>Stack item 2</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->`;

const COLUMNS_BLOCK_CONTENT = `<!-- wp:columns {"style":{"spacing":{"blockGap":{"left":"30px"}}}} -->
<div class="wp-block-columns"><!-- wp:column -->
<div class="wp-block-column"><!-- wp:paragraph -->
<p>Col 1</p>
<!-- /wp:paragraph --></div>
<!-- /wp:column -->
<!-- wp:column -->
<div class="wp-block-column"><!-- wp:paragraph -->
<p>Col 2</p>
<!-- /wp:paragraph --></div>
<!-- /wp:column --></div>
<!-- /wp:columns -->`;

const FLOW_GROUP_CONTENT = `<!-- wp:group {"layout":{"type":"default"},"style":{"spacing":{"blockGap":"35px"}}} -->
<div class="wp-block-group"><!-- wp:paragraph -->
<p>Flow item 1</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph -->
<p>Flow item 2</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->`;

test.describe( 'Gap visualizer', () => {
	async function openBlockSpacingControl( {
		page,
		editor,
		sliderName = 'Block spacing',
	} ) {
		await page.evaluate( () => {
			const settings = window.wp.data
				.select( 'core/block-editor' )
				.getSettings();
			window.wp.data.dispatch( 'core/block-editor' ).updateSettings( {
				...settings,
				__experimentalFeatures: {
					...settings.__experimentalFeatures,
					spacing: {
						...settings.__experimentalFeatures?.spacing,
						blockGap: true,
					},
				},
			} );
		} );

		await editor.openDocumentSettingsSidebar();
		const editorSettings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );

		const stylesTab = editorSettings.getByRole( 'tab', {
			name: /Styles/i,
		} );
		if ( await stylesTab.isVisible() ) {
			await stylesTab.click();
		}

		const slider = editorSettings.getByRole( 'slider', {
			name: sliderName,
		} );

		return { slider, editorSettings };
	}

	test( 'visualizes gap strips for Row (flex horizontal) and updates on change', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await editor.setContent( ROW_BLOCK_CONTENT );
		const groupBlock = editor.canvas.locator( '.wp-block-group' ).first();
		await editor.selectBlocks( groupBlock );

		const { slider } = await openBlockSpacingControl( {
			page,
			editor,
			sliderName: 'Horizontal block spacing',
		} );
		const visualizerRects = page.locator(
			'.block-editor__gap-visualizer-rect'
		);

		await expect( visualizerRects ).toHaveCount( 0 );

		await slider.hover();
		await expect( visualizerRects ).toHaveCount( 1 );
		await expect( visualizerRects.first() ).toHaveCSS( 'width', '20px' );

		// Adjust gap with slider.
		await slider.fill( '40' );

		// The strip exists and width updated.
		await expect( visualizerRects ).toHaveCount( 1 );
		await expect( visualizerRects.first() ).toHaveCSS( 'width', '40px' );

		// Disappears on mouse out.
		await page.mouse.move( 0, 0 );
		await expect( visualizerRects ).toHaveCount( 0 );
	} );

	test( 'visualizes gap strips for Stack (flex vertical) and updates on change', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await editor.setContent( STACK_BLOCK_CONTENT );
		const groupBlock = editor.canvas.locator( '.wp-block-group' ).first();
		await editor.selectBlocks( groupBlock );

		const { slider } = await openBlockSpacingControl( {
			page,
			editor,
			sliderName: 'Vertical block spacing',
		} );
		const visualizerRects = page.locator(
			'.block-editor__gap-visualizer-rect'
		);

		await expect( visualizerRects ).toHaveCount( 0 );

		await slider.hover();
		await expect( visualizerRects ).toHaveCount( 1 );
		await expect( visualizerRects.first() ).toHaveCSS( 'height', '25px' );

		// Adjust gap with slider.
		await slider.fill( '45' );

		await expect( visualizerRects ).toHaveCount( 1 );
		await expect( visualizerRects.first() ).toHaveCSS( 'height', '45px' );

		await page.mouse.move( 0, 0 );
		await expect( visualizerRects ).toHaveCount( 0 );
	} );

	test( 'Stack containing a nested Row measures Stack row gap without nested Row column strips', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await editor.setContent( STACK_WITH_NESTED_ROW_CONTENT );
		const stackBlock = editor.canvas.locator( '.wp-block-group' ).first();
		await editor.selectBlocks( stackBlock );

		const { slider } = await openBlockSpacingControl( {
			page,
			editor,
			sliderName: 'Vertical block spacing',
		} );
		const visualizerRects = page.locator(
			'.block-editor__gap-visualizer-rect'
		);
		const columnRects = page.locator(
			'.block-editor__gap-visualizer-rect[data-type="column"]'
		);

		await expect( visualizerRects ).toHaveCount( 0 );

		await slider.hover();
		await expect( visualizerRects ).toHaveCount( 1 );
		await expect( visualizerRects.first() ).toHaveCSS( 'height', '40px' );
		await expect( columnRects ).toHaveCount( 0 );

		await page.mouse.move( 0, 0 );
		await expect( visualizerRects ).toHaveCount( 0 );
	} );

	test( 'visualizes gap strips for Columns block with custom gap', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await editor.setContent( COLUMNS_BLOCK_CONTENT );
		const columnsBlock = editor.canvas
			.locator( '.wp-block-columns' )
			.first();
		await editor.selectBlocks( columnsBlock );

		const { slider } = await openBlockSpacingControl( {
			page,
			editor,
			sliderName: 'Horizontal block spacing',
		} );
		const visualizerRects = page.locator(
			'.block-editor__gap-visualizer-rect'
		);

		await expect( visualizerRects ).toHaveCount( 0 );

		await slider.hover();
		await expect( visualizerRects ).toHaveCount( 1 );
		await expect( visualizerRects.first() ).toHaveAttribute(
			'data-type',
			'column'
		);
		await expect( visualizerRects.first() ).toHaveCSS( 'width', '30px' );

		await page.mouse.move( 0, 0 );
		await expect( visualizerRects ).toHaveCount( 0 );
	} );

	// TODO: Once support for flow/constrained layout is introduced in a future PR,
	// update this test to assert that flow gap strips are rendered instead.
	test( 'hovering a non-flex block (flow layout) renders nothing and toolbar stays visible', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await editor.setContent( FLOW_GROUP_CONTENT );
		const groupBlock = editor.canvas.locator( '.wp-block-group' ).first();
		await editor.selectBlocks( groupBlock );

		const { slider } = await openBlockSpacingControl( {
			page,
			editor,
		} );
		const visualizerRects = page.locator(
			'.block-editor__gap-visualizer-rect'
		);
		const blockToolbar = page.getByRole( 'toolbar', {
			name: 'Block tools',
		} );

		await expect( visualizerRects ).toHaveCount( 0 );
		await expect( blockToolbar ).toBeVisible();

		// Hovering the spacing slider on non-flex block should NOT render strips,
		// and should NOT call hideBlockInterface (toolbar stays visible).
		await slider.hover();
		await expect( visualizerRects ).toHaveCount( 0 );
		await expect( blockToolbar ).toBeVisible();

		await page.mouse.move( 0, 0 );
		await expect( visualizerRects ).toHaveCount( 0 );
		await expect( blockToolbar ).toBeVisible();
	} );
} );
