/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';
import type CollaborationUtils from './fixtures/collaboration-utils';

type Editor = import('@wordpress/e2e-test-utils-playwright').Editor;
type Page = import('@playwright/test').Page;

const TWO_ROW_TABLE_CONTENT =
	'<!-- wp:table -->\n' +
	'<figure class="wp-block-table"><table><tbody>' +
	'<tr><td>Alpha</td><td>Beta</td></tr>' +
	'<tr><td>Gamma</td><td>Delta</td></tr>' +
	'</tbody></table></figure>\n' +
	'<!-- /wp:table -->';

const TABLE_WITH_CAPTION_CONTENT =
	'<!-- wp:table -->\n' +
	'<figure class="wp-block-table"><table><tbody>' +
	'<tr><td>Alpha</td><td>Beta</td></tr>' +
	'</tbody></table><figcaption class="wp-element-caption">Caption target</figcaption></figure>\n' +
	'<!-- /wp:table -->';

async function expectTableBlockLoaded(
	collaborationUtils: CollaborationUtils
) {
	await expect
		.poll( () => collaborationUtils.editor2.getBlocks(), {
			timeout: 10000,
		} )
		.toMatchObject( [
			{
				name: 'core/table',
			},
		] );
}

async function getBodyCellTexts( editor: Editor ) {
	return editor.canvas
		.getByRole( 'textbox', { name: 'Body cell text' } )
		.evaluateAll( ( cells ) =>
			cells.map( ( cell ) => cell.textContent?.trim() )
		);
}

function getBodyCellAttributeKey( index: number ) {
	return `body.${ Math.floor( index / 2 ) }.cells.${ index % 2 }.content`;
}

function getBodyCellRichText( editor: Editor, index: number ) {
	return editor.canvas.locator(
		`[data-wp-block-attribute-key="${ getBodyCellAttributeKey( index ) }"]`
	);
}

async function placeCursorAtEndOfCell( {
	editor,
	page,
	index,
}: {
	editor: Editor;
	page: Page;
	index: number;
} ) {
	const cell = getBodyCellRichText( editor, index );

	await cell.click();
	await page.keyboard.press( 'End' );
}

async function deleteTableRow( {
	editor,
	page,
	index,
}: {
	editor: Editor;
	page: Page;
	index: number;
} ) {
	await editor.canvas
		.getByRole( 'textbox', { name: 'Body cell text' } )
		.nth( index )
		.click();
	await editor.clickBlockToolbarButton( 'Edit table' );
	await page.getByRole( 'menuitem', { name: 'Delete row' } ).click();
}

async function insertTableRowBefore( {
	editor,
	page,
	index,
}: {
	editor: Editor;
	page: Page;
	index: number;
} ) {
	await editor.canvas
		.getByRole( 'textbox', { name: 'Body cell text' } )
		.nth( index )
		.click();
	await editor.clickBlockToolbarButton( 'Edit table' );
	await page.getByRole( 'menuitem', { name: 'Insert row before' } ).click();
}

async function expectRemoteCursorInsideCell( page: Page, cellIndex: number ) {
	const editorFrame = page.frameLocator( 'iframe[name="editor-canvas"]' );
	const cursor = editorFrame.locator( '.collaborators-overlay-user-cursor' );

	await expect
		.poll( () => cursor.count(), { timeout: 15000 } )
		.toBeGreaterThan( 0 );

	const cursorBox = await cursor.first().boundingBox();
	if ( ! cursorBox ) {
		throw new Error( 'Collaborator cursor bounding box not available' );
	}
	expect( cursorBox.height ).toBeGreaterThan( 0 );

	const remoteCell = editorFrame
		.locator( 'role=textbox[name="Body cell text"i]' )
		.nth( cellIndex );
	const cellBox = await remoteCell.boundingBox();
	if ( ! cellBox ) {
		throw new Error( 'Remote target cell bounding box not available' );
	}

	const cursorCenterX = cursorBox.x + cursorBox.width / 2;
	const cursorCenterY = cursorBox.y + cursorBox.height / 2;
	const tolerance = 4;

	expect( cursorCenterX ).toBeGreaterThanOrEqual( cellBox.x - tolerance );
	expect( cursorCenterX ).toBeLessThanOrEqual(
		cellBox.x + cellBox.width + tolerance
	);
	expect( cursorCenterY ).toBeGreaterThanOrEqual( cellBox.y - tolerance );
	expect( cursorCenterY ).toBeLessThanOrEqual(
		cellBox.y + cellBox.height + tolerance
	);
}

async function getSelectionAttributeKeys( page: Page ) {
	return page.evaluate( () => {
		const blockEditor = window.wp.data.select( 'core/block-editor' );
		return {
			start: blockEditor.getSelectionStart()?.attributeKey ?? null,
			end: blockEditor.getSelectionEnd()?.attributeKey ?? null,
		};
	} );
}

async function dragBetweenCells( {
	editor,
	page,
	startIndex,
	endIndex,
}: {
	editor: Editor;
	page: Page;
	startIndex: number;
	endIndex: number;
} ) {
	const startCell = getBodyCellRichText( editor, startIndex );
	const endCell = getBodyCellRichText( editor, endIndex );

	await startCell.scrollIntoViewIfNeeded();
	await endCell.scrollIntoViewIfNeeded();

	const startBox = await startCell.boundingBox();
	const endBox = await endCell.boundingBox();

	if ( ! startBox || ! endBox ) {
		throw new Error( 'Could not resolve table cell bounding boxes' );
	}

	await page.mouse.move(
		startBox.x + startBox.width * 0.75,
		startBox.y + startBox.height / 2
	);
	await page.mouse.down();
	await page.mouse.move(
		endBox.x + endBox.width * 0.75,
		endBox.y + endBox.height / 2,
		{ steps: 12 }
	);
	await page.mouse.up();
}

test.describe( 'Collaboration - Nested Awareness Selection', () => {
	test( 'cursor in a table cell appears in the same cell for another user', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Nested Awareness Selection Test',
			status: 'draft',
			date_gmt: new Date().toISOString(),
			content: TWO_ROW_TABLE_CONTENT,
		} );

		await collaborationUtils.openCollaborativeSession( post.id );

		const { page2 } = collaborationUtils;

		await expectTableBlockLoaded( collaborationUtils );

		// Target the last cell — row 1, column 1 ("Delta"), which is nth=3
		// in a 2x2 grid. Picking the last cell maximizes distance from the
		// first cell, so a bug that flattens offsets onto cell (0,0) is
		// easy to detect via bounding boxes below.
		const targetCell = editor.canvas.locator(
			'role=textbox[name="Body cell text"i] >> nth=3'
		);

		await targetCell.click();
		await targetCell.click();
		await page.keyboard.press( 'End' );

		// Sender side: selection state should point to the target cell's
		// nested attribute path.
		await expect
			.poll(
				() =>
					page.evaluate(
						() =>
							window.wp.data
								.select( 'core/block-editor' )
								.getSelectionStart()?.attributeKey ?? ''
					),
				{ timeout: 5000 }
			)
			.toBe( 'body.1.cells.1.content' );

		const editorFrame = page2.frameLocator(
			'iframe[name="editor-canvas"]'
		);
		const cursor = editorFrame.locator(
			'.collaborators-overlay-user-cursor'
		);

		await expect
			.poll( () => cursor.count(), { timeout: 15000 } )
			.toBeGreaterThan( 0 );

		const cursorBox = await cursor.first().boundingBox();
		if ( ! cursorBox ) {
			throw new Error( 'Collaborator cursor bounding box not available' );
		}
		expect( cursorBox.height ).toBeGreaterThan( 0 );

		// Receiver side: verify the rendered cursor lands inside the same
		// cell, not flattened onto the first cell.
		const remoteCell = editorFrame.locator(
			'role=textbox[name="Body cell text"i] >> nth=3'
		);
		const cellBox = await remoteCell.boundingBox();
		if ( ! cellBox ) {
			throw new Error( 'Remote target cell bounding box not available' );
		}

		const cursorCenterX = cursorBox.x + cursorBox.width / 2;
		const cursorCenterY = cursorBox.y + cursorBox.height / 2;
		expect( cursorCenterX ).toBeGreaterThanOrEqual( cellBox.x );
		expect( cursorCenterX ).toBeLessThanOrEqual(
			cellBox.x + cellBox.width
		);
		expect( cursorCenterY ).toBeGreaterThanOrEqual( cellBox.y );
		expect( cursorCenterY ).toBeLessThanOrEqual(
			cellBox.y + cellBox.height
		);
	} );

	test( 'cursor follows a table cell after another user deletes a preceding row', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Nested Awareness Selection Row Delete Test',
			status: 'draft',
			date_gmt: new Date().toISOString(),
			content: TWO_ROW_TABLE_CONTENT,
		} );

		await collaborationUtils.openCollaborativeSession( post.id );

		const { editor2, page2 } = collaborationUtils;

		await expectTableBlockLoaded( collaborationUtils );

		await placeCursorAtEndOfCell( { editor, page, index: 3 } );

		await expect
			.poll(
				() =>
					page.evaluate(
						() =>
							window.wp.data
								.select( 'core/block-editor' )
								.getSelectionStart()?.attributeKey ?? ''
					),
				{ timeout: 5000 }
			)
			.toBe( 'body.1.cells.1.content' );

		await expectRemoteCursorInsideCell( page2, 3 );

		await deleteTableRow( { editor: editor2, page: page2, index: 0 } );

		await collaborationUtils.waitForConvergence( { timeout: 15000 } );

		await expect
			.poll( () => getBodyCellTexts( editor2 ), { timeout: 10000 } )
			.toEqual( [ 'Gamma', 'Delta' ] );

		await expectRemoteCursorInsideCell( page2, 1 );
	} );

	test( 'cursor follows a table cell after another user inserts a preceding row', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Nested Awareness Selection Row Insert Test',
			status: 'draft',
			date_gmt: new Date().toISOString(),
			content: TWO_ROW_TABLE_CONTENT,
		} );

		await collaborationUtils.openCollaborativeSession( post.id );

		const { editor2, page2 } = collaborationUtils;

		await expectTableBlockLoaded( collaborationUtils );

		await placeCursorAtEndOfCell( { editor, page, index: 3 } );

		await expect
			.poll( () => getSelectionAttributeKeys( page ), { timeout: 5000 } )
			.toMatchObject( {
				start: 'body.1.cells.1.content',
				end: 'body.1.cells.1.content',
			} );

		await expectRemoteCursorInsideCell( page2, 3 );

		await insertTableRowBefore( {
			editor: editor2,
			page: page2,
			index: 3,
		} );

		await collaborationUtils.waitForConvergence( { timeout: 15000 } );

		await expect
			.poll( () => getBodyCellTexts( editor2 ), { timeout: 10000 } )
			.toEqual( [ 'Alpha', 'Beta', '', '', 'Gamma', 'Delta' ] );

		await expectRemoteCursorInsideCell( page2, 5 );
	} );

	test( 'mouse drag selection across table cells preserves distinct attribute keys', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Nested Awareness Selection Cross Cell Drag Test',
			status: 'draft',
			date_gmt: new Date().toISOString(),
			content: TWO_ROW_TABLE_CONTENT,
		} );

		await collaborationUtils.openCollaborativeSession( post.id );

		await expectTableBlockLoaded( collaborationUtils );

		await dragBetweenCells( {
			editor,
			page,
			startIndex: 1,
			endIndex: 3,
		} );

		await expect
			.poll( () => getSelectionAttributeKeys( page ), { timeout: 5000 } )
			.toMatchObject( {
				start: 'body.0.cells.1.content',
				end: 'body.1.cells.1.content',
			} );
	} );

	test( 'cursor in a table caption disappears when another user removes the caption', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Nested Awareness Selection Caption Delete Test',
			status: 'draft',
			date_gmt: new Date().toISOString(),
			content: TABLE_WITH_CAPTION_CONTENT,
		} );

		await collaborationUtils.openCollaborativeSession( post.id );

		const { editor2, page2 } = collaborationUtils;

		await expectTableBlockLoaded( collaborationUtils );

		await editor.canvas
			.getByRole( 'textbox', { name: 'Table caption text' } )
			.click();
		await page.keyboard.press( 'End' );

		await expect
			.poll( () => getSelectionAttributeKeys( page ), { timeout: 5000 } )
			.toMatchObject( {
				start: 'caption',
				end: 'caption',
			} );

		const editorFrame = page2.frameLocator(
			'iframe[name="editor-canvas"]'
		);
		const cursor = editorFrame.locator(
			'.collaborators-overlay-user-cursor'
		);

		await expect
			.poll( () => cursor.count(), { timeout: 15000 } )
			.toBeGreaterThan( 0 );

		await editor2.canvas
			.getByRole( 'textbox', { name: 'Table caption text' } )
			.click();
		await editor2.clickBlockToolbarButton( 'Remove caption' );

		await collaborationUtils.waitForConvergence( { timeout: 15000 } );

		await expect.poll( () => cursor.count(), { timeout: 10000 } ).toBe( 0 );
	} );
} );
