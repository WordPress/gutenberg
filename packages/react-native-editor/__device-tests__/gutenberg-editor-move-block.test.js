/**
 * Internal dependencies
 */
import { isAndroid } from './helpers/utils';
import { blockNames } from './pages/editor-page';

describe( 'Gutenberg Editor Block Mover tests', () => {
	const cancelButtonName = 'Cancel';
	const buttonIosType = 'Button';
	const moveTopButtonName = 'Move to top';
	const moveBottomButtonName = 'Move to bottom';

	async function setupBlocks( text = 'p1' ) {
		await editorPage.addNewBlock( blockNames.paragraph );
		const paragraphBlock = await editorPage.getBlockAtPosition(
			blockNames.paragraph
		);
		await editorPage.typeTextToParagraphBlock( paragraphBlock, text );

		await editorPage.addNewBlock( blockNames.heading );
		const headerBlock = await editorPage.getBlockAtPosition(
			blockNames.heading,
			2
		);
		await editorPage.typeTextToParagraphBlock( headerBlock, text );
	}

	async function removeBlocks( blockOrder ) {
		for ( let i = blockOrder.length; i > 0; i-- ) {
			await editorPage.removeBlockAtPosition( blockOrder[ i - 1 ], i );
		}
	}

	async function cancelActionSheet( ePage ) {
		if ( isAndroid() ) {
			await ePage.tapCoordinates( 100, 100 );
		} else {
			await ePage.selectElement( cancelButtonName, buttonIosType );
		}
	}

	it( 'should be able to see move block to top when long pressing up and change nothing when pressing cancel', async () => {
		await setupBlocks( 'p1-up-cancel' );

		await editorPage.longPressToolBarButton(
			'Move block up from row 2 to row 1'
		);
		const moveUpAction = await editorPage.findElementByXPath(
			moveTopButtonName,
			buttonIosType
		);

		expect( moveUpAction ).toBeTruthy();

		await cancelActionSheet( editorPage );
		const paragraphIsFirst = await editorPage.hasBlockAtPosition(
			1,
			blockNames.paragraph
		);

		expect( paragraphIsFirst ).toBe( true );

		await removeBlocks( [ blockNames.paragraph, blockNames.heading ] );
	} );

	it( 'should be able to move block to first block when pressing move block to top', async () => {
		await setupBlocks( 'p1-up' );

		await editorPage.longPressToolBarButton(
			'Move block up from row 2 to row 1'
		);
		await editorPage.selectElement( moveTopButtonName, buttonIosType );
		const headerIsFirst = await editorPage.hasBlockAtPosition(
			1,
			blockNames.heading
		);

		expect( headerIsFirst ).toBe( true );

		await editorPage.selectBlock( blockNames.paragraph, 2 );
		await removeBlocks( [ blockNames.heading, blockNames.paragraph ] );
	} );

	it( 'should have move up disabled when on top', async () => {
		await setupBlocks( 'p1-disabled-top' );
		await editorPage.selectBlock( blockNames.paragraph );

		await editorPage.longPressToolBarButton( 'Move block up' );
		const moveUpAction = await editorPage.findElementByXPath(
			moveTopButtonName,
			buttonIosType
		);

		expect( moveUpAction ).toBe( undefined );

		await editorPage.selectBlock( blockNames.heading, 2 );
		await removeBlocks( [ blockNames.paragraph, blockNames.heading ] );
	} );

	it( 'should be able to see move block to bottom when long pressing down and change nothing when pressing cancel', async () => {
		await setupBlocks( 'p1-down-cancel' );
		await editorPage.selectBlock( blockNames.paragraph );

		await editorPage.longPressToolBarButton(
			'Move block down from row 1 to row 2'
		);
		const moveDownAction = await editorPage.findElementByXPath(
			moveBottomButtonName,
			buttonIosType
		);

		expect( moveDownAction ).toBeTruthy();

		await cancelActionSheet( editorPage );
		const paragraphIsFirst = await editorPage.hasBlockAtPosition(
			1,
			blockNames.paragraph
		);

		expect( paragraphIsFirst ).toBe( true );

		await editorPage.selectBlock( blockNames.heading, 2 );
		await removeBlocks( [ blockNames.paragraph, blockNames.heading ] );
	} );

	it( 'should be able to move block to last block when pressing move block to bottom', async () => {
		await setupBlocks( 'p1-down' );
		await editorPage.selectBlock( blockNames.paragraph );

		await editorPage.longPressToolBarButton(
			'Move block down from row 1 to row 2'
		);

		await editorPage.selectElement( moveBottomButtonName, buttonIosType );
		const headerIsFirst = await editorPage.hasBlockAtPosition(
			1,
			blockNames.heading
		);

		expect( headerIsFirst ).toBe( true );

		await removeBlocks( [ blockNames.heading, blockNames.paragraph ] );
	} );

	it( 'should have move down disabled when on bottom', async () => {
		await setupBlocks( 'p1-disabled-down' );

		await editorPage.longPressToolBarButton( 'Move block down' );
		const moveDownAction = await editorPage.findElementByXPath(
			moveBottomButtonName,
			buttonIosType
		);

		expect( moveDownAction ).toBe( undefined );

		await removeBlocks( [ blockNames.paragraph, blockNames.heading ] );
	} );
} );
