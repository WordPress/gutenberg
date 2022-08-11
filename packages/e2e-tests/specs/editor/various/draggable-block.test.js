/**
 * WordPress dependencies
 */
import {
	getEditedPostContent,
	createNewPost,
	deactivatePlugin,
	activatePlugin,
	showBlockToolbar,
	setBrowserViewport,
	waitForWindowDimensions,
} from '@wordpress/e2e-test-utils';

describe( 'Draggable block', () => {
	// Tests don't seem to pass if beforeAll and afterAll are used.
	// Unsure why.
	beforeEach( async () => {
		await deactivatePlugin(
			'gutenberg-test-plugin-disables-the-css-animations'
		);

		// Set the viewport at a larger size than normal to ensure scrolling doesn't occur.
		// Scrolling can interfere with the drag coordinates.
		await page.setViewport( { width: 960, height: 1024 } );
		await waitForWindowDimensions( 960, 1024 );
		await createNewPost();
		await page.setDragInterception( true );
	} );

	afterEach( async () => {
		await page.setDragInterception( false );

		// Reset the viewport to normal large size.
		await setBrowserViewport( 'large' );
		await activatePlugin(
			'gutenberg-test-plugin-disables-the-css-animations'
		);
	} );

	it( 'can drag and drop to the top of a block list', async () => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );

		// Confirm correct setup.
		expect( await getEditedPostContent() ).toMatchSnapshot();

		await showBlockToolbar();
		const dragHandle = await page.waitForSelector(
			'.block-editor-block-mover__drag-handle'
		);
		const dragHandlePoint = await dragHandle.clickablePoint();

		const firstParagraph = await page.$( '[data-type="core/paragraph"]' );
		const targetPoint = await firstParagraph.clickablePoint();
		const targetRect = await firstParagraph.boundingBox();
		const target = {
			x: targetPoint.x,
			// Drag to the top half.
			y: targetPoint.y - targetRect.height * 0.25,
		};

		const dragData = await page.mouse.drag( dragHandlePoint, target );
		await page.mouse.dragEnter( target, dragData );
		await page.mouse.dragOver( target, dragData );

		// Wait for the insertion point to be visible.
		const insertionPoint = await page.waitForSelector(
			'.block-editor-block-list__insertion-point'
		);

		// Expect the insertion point to be visible above the first paragraph.
		const insertionPointBoundingBox = await insertionPoint.boundingBox();
		expect( insertionPointBoundingBox.y ).toBeLessThan( target.y );

		await page.mouse.drop( target, dragData );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can drag and drop to the bottom of a block list', async () => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'ArrowUp' );

		// Confirm correct setup.
		expect( await getEditedPostContent() ).toMatchSnapshot();

		const [ , secondParagraph ] = await page.$$(
			'[data-type="core/paragraph"]'
		);

		await showBlockToolbar();
		const dragHandle = await page.waitForSelector(
			'.block-editor-block-mover__drag-handle'
		);
		const dragHandlePoint = await dragHandle.clickablePoint();

		const targetPoint = await secondParagraph.clickablePoint();
		const targetRect = await secondParagraph.boundingBox();
		const target = {
			x: targetPoint.x,
			// Drag to the bottom half.
			y: targetPoint.y + targetRect.height * 0.25,
		};

		const dragData = await page.mouse.drag( dragHandlePoint, target );
		await page.mouse.dragEnter( target, dragData );
		await page.mouse.dragOver( target, dragData );

		// Wait for the insertion point to be visible.
		const insertionPoint = await page.waitForSelector(
			'.block-editor-block-list__insertion-point'
		);

		// Expect the insertion point to be visible below the first paragraph.
		const insertionPointBoundingBox = await insertionPoint.boundingBox();
		expect( insertionPointBoundingBox.y ).toBeGreaterThan( target.y );

		await page.mouse.drop( target, dragData );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
