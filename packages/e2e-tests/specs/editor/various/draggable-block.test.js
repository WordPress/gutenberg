/**
 * WordPress dependencies
 */
import {
	getEditedPostContent,
	createNewPost,
	deactivatePlugin,
	activatePlugin,
	showBlockToolbar,
} from '@wordpress/e2e-test-utils';

describe( 'Draggable block', () => {
	beforeAll( async () => {
		await page.setDragInterception( true );
		await deactivatePlugin(
			'gutenberg-test-plugin-disables-the-css-animations'
		);
	} );

	afterAll( async () => {
		await page.setDragInterception( false );
		await activatePlugin(
			'gutenberg-test-plugin-disables-the-css-animations'
		);
	} );

	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'should drag and drop', async () => {
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

		const paragraph = await page.$( '[data-type="core/paragraph"]' );
		const paragraphPoint = await paragraph.clickablePoint();
		const paragraphRect = await paragraph.boundingBox();

		await page.mouse.dragAndDrop( dragHandlePoint, {
			x: paragraphPoint.x,
			// Drag to the top half.
			y: paragraphPoint.y - paragraphRect.height / 4,
		} );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
