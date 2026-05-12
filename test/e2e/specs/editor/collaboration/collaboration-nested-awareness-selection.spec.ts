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

async function placeCursorAtEndOfCell( {
	editor,
	page,
	index,
}: {
	editor: Editor;
	page: Page;
	index: number;
} ) {
	const cell = editor.canvas
		.getByRole( 'textbox', { name: 'Body cell text' } )
		.nth( index );

	await cell.click();
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
} );
