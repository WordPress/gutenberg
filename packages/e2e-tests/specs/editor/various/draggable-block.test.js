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
					event.dataTransfer.getData( 'wp-blocks' )
				);
			} );
		} );

		await page.mouse.move( x, y );
		await page.mouse.down();

		await page.mouse.move( x + 10, y + 10, { steps: 10 } );

		// Confirm dragged state.
		await page.waitForSelector( '.block-editor-block-mover__drag-clone' );

		const paragraph = await page.$( '[data-type="core/paragraph"]' );

		const paragraphRect = await paragraph.boundingBox();
		const pX = paragraphRect.x + paragraphRect.width / 2;
		const pY = paragraphRect.y + paragraphRect.height / 3;

		// Move over upper side of the first paragraph.
		await page.mouse.move( pX, pY, { steps: 10 } );

		// Puppeteer fires the initial `dragstart` event, but no further events.
		// Simulating the drop event works.
		await paragraph.evaluate(
			( element, clientX, clientY ) => {
				const dataTransfer = new DataTransfer();
				dataTransfer.setData(
					'wp-blocks',
					JSON.stringify( window._dataTransfer )
				);
				const event = new DragEvent( 'drop', {
					bubbles: true,
					clientX,
					clientY,
					dataTransfer,
				} );
				element.dispatchEvent( event );
			},
			pX,
			pY
		);

		await page.mouse.up();

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
