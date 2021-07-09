/**
 * WordPress dependencies
 */
import {
	createNewPost,
	insertBlock,
	getEditedPostContent,
	pressKeyWithModifier,
} from '@wordpress/e2e-test-utils';

async function dragAndDrop( draggableElement, targetElement, offsetY ) {
	const draggableRect = await draggableElement.boundingBox();
	const dragPosition = {
		x: draggableRect.x + draggableRect.width / 2,
		y: draggableRect.y + draggableRect.height / 2,
	};

	const targetRect = await targetElement.boundingBox();
	const targetPosition = {
		x: targetRect.x + targetRect.width / 2,
		y: offsetY + targetRect.y + targetRect.height / 2,
	};

	return await page.mouse.dragAndDrop( dragPosition, targetPosition, {
		delay: 1000,
	} );
}

describe( 'List view', () => {
	beforeAll( async () => {
		await page.setDragInterception( true );
	} );

	beforeEach( async () => {
		await createNewPost();
	} );

	afterAll( async () => {
		await page.setDragInterception( false );
	} );

	it( 'allows a user to drag a block to a new sibling position', async () => {
		// Insert some blocks of different types.
		await insertBlock( 'Heading' );
		await insertBlock( 'Image' );
		await insertBlock( 'Paragraph' );

		// Open list view.
		await pressKeyWithModifier( 'access', 'o' );

		const paragraphBlock = await page.waitForXPath(
			'//button[contains(., "Paragraph")][@draggable="true"]'
		);

		// Drag above the heading block
		const headingBlock = await page.waitForXPath(
			'//button[contains(., "Heading")][@draggable="true"]'
		);

		await dragAndDrop( paragraphBlock, headingBlock, -5 );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
