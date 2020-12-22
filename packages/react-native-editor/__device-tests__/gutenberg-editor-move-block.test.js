/**
 * Internal dependencies
 */
import { isAndroid } from './helpers/utils';

jest.setTimeout( 1000000 );

describe( 'Gutenberg Editor Block Mover tests', () => {
	const paragraphBlockName = 'Paragraph';
	const headerBlockName = 'Heading';
	const cancelButtonName = 'Cancel';
	const buttonIosType = 'Button';
	const moveTopButtonName = 'Move to top';
	const moveBottomButtonName = 'Move to bottom';

	async function setupBlocks( text = 'p1' ) {
		await editorPage.addNewBlock( paragraphBlockName );
		const paragraphBlock = await editorPage.getBlockAtPosition(
			paragraphBlockName
		);
		await editorPage.typeTextToParagraphBlock( paragraphBlock, text );

		await editorPage.addNewBlock( headerBlockName );
		const headerBlock = await editorPage.getBlockAtPosition(
			headerBlockName,
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

	it( 'should be able to see visual editor', async () => {
		await expect( editorPage.getBlockList() ).resolves.toBe( true );
	} );

	it( 'should be able to see move block to top when long pressing up and change nothing when pressing cancel', async () => {
		await setupBlocks( 'p1-up-cancel' );

		await editorPage.longPressToolBarButton(
			'Move block up from row 2 to row 1'
		);
		const moveUpAction = await editorPage.findElement(
			moveTopButtonName,
			buttonIosType
		);

		expect( moveUpAction ).toBeTruthy();

		await cancelActionSheet( editorPage );
		const paragraphIsFirst = await editorPage.hasBlockAtPosition(
			1,
			paragraphBlockName
		);

		expect( paragraphIsFirst ).toBe( true );

		await removeBlocks( [ paragraphBlockName, headerBlockName ] );
	} );

	it( 'should be able to move block to first block when pressing move block to top', async () => {
		await setupBlocks( 'p1-up' );

		await editorPage.longPressToolBarButton(
			'Move block up from row 2 to row 1'
		);
		await editorPage.selectElement( moveTopButtonName, buttonIosType );
		const headerIsFirst = await editorPage.hasBlockAtPosition(
			1,
			headerBlockName
		);

		expect( headerIsFirst ).toBe( true );

		await editorPage.selectBlock( paragraphBlockName, 2 );
		await removeBlocks( [ headerBlockName, paragraphBlockName ] );
	} );

	it( 'should have move up disabled when on top', async () => {
		await setupBlocks( 'p1-disabled-top' );
		await editorPage.selectBlock( paragraphBlockName );

		await editorPage.longPressToolBarButton( 'Move block up' );
		const moveUpAction = await editorPage.findElement(
			moveTopButtonName,
			buttonIosType
		);

		expect( moveUpAction ).toBe( undefined );

		await editorPage.selectBlock( headerBlockName, 2 );
		await removeBlocks( [ paragraphBlockName, headerBlockName ] );
	} );

	it( 'should be able to see move block to bottom when long pressing down and change nothing when pressing cancel', async () => {
		await setupBlocks( 'p1-down-cancel' );
		await editorPage.selectBlock( paragraphBlockName );

		await editorPage.longPressToolBarButton(
			'Move block down from row 1 to row 2'
		);
		const moveDownAction = await editorPage.findElement(
			moveBottomButtonName,
			buttonIosType
		);

		expect( moveDownAction ).toBeTruthy();

		await cancelActionSheet( editorPage );
		const paragraphIsFirst = await editorPage.hasBlockAtPosition(
			1,
			paragraphBlockName
		);

		expect( paragraphIsFirst ).toBe( true );

		await editorPage.selectBlock( headerBlockName, 2 );
		await removeBlocks( [ paragraphBlockName, headerBlockName ] );
	} );

	it( 'should be able to move block to last block when pressing move block to bottom', async () => {
		await setupBlocks( 'p1-down' );
		await editorPage.selectBlock( paragraphBlockName );

		await editorPage.longPressToolBarButton(
			'Move block down from row 1 to row 2'
		);

		await editorPage.selectElement( moveBottomButtonName, buttonIosType );
		const headerIsFirst = await editorPage.hasBlockAtPosition(
			1,
			headerBlockName
		);

		expect( headerIsFirst ).toBe( true );

		await removeBlocks( [ headerBlockName, paragraphBlockName ] );
	} );

	it( 'should have move down disabled when on bottom', async () => {
		await setupBlocks( 'p1-disabled-down' );

		await editorPage.longPressToolBarButton( 'Move block down' );
		const moveDownAction = await editorPage.findElement(
			moveBottomButtonName,
			buttonIosType
		);

		expect( moveDownAction ).toBe( undefined );

		await removeBlocks( [ paragraphBlockName, headerBlockName ] );
	} );
} );
