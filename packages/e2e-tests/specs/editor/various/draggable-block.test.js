/**
 * WordPress dependencies
 */
import {
	getEditedPostContent,
	createNewPost,
	deactivatePlugin,
	activatePlugin,
	showBlockToolbar,
	canvas,
} from '@wordpress/e2e-test-utils';

describe( 'Draggable block', () => {
	beforeAll( async () => {
		await deactivatePlugin(
			'gutenberg-test-plugin-disables-the-css-animations'
		);
	} );

	afterAll( async () => {
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
		await page.waitForSelector( '.block-editor-block-mover__drag-handle' );

		const dragHandle = await page.$(
			'.block-editor-block-mover__drag-handle'
		);
		const dragHandleRect = await dragHandle.boundingBox();
		const x = dragHandleRect.x + dragHandleRect.width / 2;
		const y = dragHandleRect.y + dragHandleRect.height / 2;

		await page.evaluate( () => {
			document.addEventListener( 'dragstart', ( event ) => {
				window._dataTransfer = JSON.parse(
					event.dataTransfer.getData( 'text' )
				);
			} );
		} );

		await page.mouse.move( x, y );
		await page.mouse.down();

		await page.mouse.move( x + 10, y + 10, { steps: 10 } );

		// Confirm dragged state.
		await page.waitForSelector( '.components-draggable__clone' );

		// Puppeteer fires the initial `dragstart` event, but no further events.
		// Simulating the drop event works.
		await canvas().evaluate( () => {
			const paragraph = document.querySelector(
				'[data-type="core/paragraph"]'
			);
			const paragraphRect = paragraph.getBoundingClientRect();
			const dataTransfer = new DataTransfer();
			dataTransfer.setData(
				'text/plain',
				JSON.stringify( window.parent._dataTransfer )
			);
			const event = new DragEvent( 'drop', {
				bubbles: true,
				clientX: paragraphRect.x + paragraphRect.width / 2,
				clientY: paragraphRect.y + paragraphRect.height / 3,
				dataTransfer,
			} );
			paragraph.dispatchEvent( event );
		} );

		await page.mouse.up();

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
