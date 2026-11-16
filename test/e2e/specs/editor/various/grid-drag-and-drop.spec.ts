import type { Locator, Page } from '@playwright/test';
import { test as base, expect } from '@wordpress/e2e-test-utils-playwright';
import type { Editor } from '@wordpress/e2e-test-utils-playwright';

const BASE_URL = process.env.WP_BASE_URL || 'http://localhost:8889';

interface Point {
	x: number;
	y: number;
}

interface Box extends Point {
	width: number;
	height: number;
}

interface Cell {
	columnCount: number;
	rowCount: number;
	column: number;
	row: number;
}

interface DragOptions {
	/** Called just before the drop. */
	beforeDrop?: () => Promise< unknown >;
}

const test = base.extend< { gridDragUtils: GridDragUtils } >( {
	gridDragUtils: async ( { page, editor }, use ) => {
		await use( new GridDragUtils( { page, editor } ) );
	},
} );

test.use( {
	// Wide enough for the grids' cells to be bigger than the toolbars.
	viewport: { width: 1600, height: 1100 },
} );

/**
 * Whether a block drag is in progress, according to the block editor store.
 *
 * @param page The page.
 *
 * @return Whether blocks are being dragged.
 */
function isDraggingBlocks( page: Page ): Promise< boolean > {
	return page.evaluate( () =>
		( window as any ).wp.data
			.select( 'core/block-editor' )
			.isDraggingBlocks()
	);
}

/**
 * A manual grid, whose cells have a fixed size, so blocks dropped in it land
 * exactly where they are let go.
 *
 * @param options
 * @param options.columnCount Number of columns.
 * @param options.rowCount    Number of rows.
 * @param options.content     Inner blocks markup.
 * @param options.attributes  Other Group attributes.
 *
 * @return The grid's markup.
 */
function getGridMarkup( {
	columnCount,
	rowCount,
	content,
	attributes = {},
}: {
	columnCount: number;
	rowCount: number;
	content: string;
	attributes?: Record< string, unknown >;
} ) {
	const attributesMarkup = JSON.stringify( {
		...attributes,
		layout: {
			type: 'grid',
			columnCount,
			rowCount,
			isManualPlacement: true,
		},
	} );
	return `<!-- wp:group ${ attributesMarkup } -->
<div class="wp-block-group">${ content }</div>
<!-- /wp:group -->`;
}

const IMAGES_GRID = getGridMarkup( {
	columnCount: 3,
	rowCount: 2,
	content: [ 'one', 'two' ]
		.map(
			( alt, index ) =>
				`<!-- wp:image {"style":{"layout":{"columnStart":${
					index + 1
				},"rowStart":1}}} -->
<figure class="wp-block-image"><img src="${ BASE_URL }/wp-admin/images/wordpress-logo.png" alt="${ alt }"/></figure>
<!-- /wp:image -->`
		)
		.join( '' ),
} );

const PARAGRAPH_GRID_CONTENT = `<!-- wp:paragraph {"style":{"layout":{"columnStart":1,"rowStart":1}}} -->
<p>First</p>
<!-- /wp:paragraph -->`;

const PARAGRAPH_GRID = getGridMarkup( {
	columnCount: 4,
	rowCount: 3,
	content: PARAGRAPH_GRID_CONTENT,
} );

test.describe( 'Grid drag and drop (@webkit)', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-grid-interactivity',
		] );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test( 'moves a block where it is dropped, drag after drag', async ( {
		editor,
		page,
		gridDragUtils,
	} ) => {
		await editor.setContent( IMAGES_GRID );
		const grid = editor.canvas.getByRole( 'document', {
			name: 'Block: Canvas',
		} );
		const image = editor.canvas
			.getByRole( 'document', { name: 'Block: Image' } )
			.first();
		const toolbarDragHandle = page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Drag' } );

		// Each drop leaves the block tools as they were, so the next drag,
		// from the block's body or from the block toolbar, works too.
		for ( const [ by, column, row ] of [
			[ 'body', 3, 2 ],
			[ 'body', 1, 2 ],
			[ 'body', 3, 1 ],
			[ 'toolbar handle', 1, 2 ],
			[ 'toolbar handle', 3, 2 ],
			[ 'body', 1, 1 ],
		] as [ string, number, number ][] ) {
			await test.step( `by its ${ by } to ${ column }, ${ row }`, async () => {
				await editor.selectBlocks( image );
				const from =
					by === 'body'
						? await gridDragUtils.getCenter( image )
						: await gridDragUtils.getCenter( toolbarDragHandle );
				const to = await gridDragUtils.getCellCenter( grid, {
					columnCount: 3,
					rowCount: 2,
					column,
					row,
				} );

				const landing = await gridDragUtils.drag( from, to );

				await gridDragUtils.expectToLandOnPreview( image, landing );
				await gridDragUtils.expectCenterInCell( image, grid, {
					columnCount: 3,
					rowCount: 2,
					column,
					row,
				} );
				await expect( gridDragUtils.draggingBlockTools ).toHaveCount(
					0
				);
				await expect
					.poll( () => isDraggingBlocks( page ) )
					.toBe( false );
				await expect(
					page.locator( '.block-editor-grid-item-resizer__box' )
				).toBeVisible();
			} );
		}
	} );

	test( 'ends the drag of a block dropped in from outside the grid', async ( {
		editor,
		page,
		gridDragUtils,
		browserName,
	} ) => {
		test.skip(
			browserName === 'webkit',
			'The drag of a block from outside the grid does not reach the grid in Playwright WebKit.'
		);
		await editor.setContent(
			`<!-- wp:image -->
<figure class="wp-block-image"><img src="${ BASE_URL }/wp-admin/images/wordpress-logo.png" alt="outside"/></figure>
<!-- /wp:image -->${ IMAGES_GRID }`
		);
		const grid = editor.canvas.getByRole( 'document', {
			name: 'Block: Canvas',
		} );
		const gridImages = grid.getByRole( 'document', {
			name: 'Block: Image',
		} );
		const outside = editor.canvas
			.getByRole( 'document', { name: 'Block: Image' } )
			.first();
		await expect( gridImages ).toHaveCount( 2 );
		// The image moves the grid down when it loads, so the drag is measured
		// once it has.
		await expect
			.poll( () =>
				outside
					.getByRole( 'img' )
					.evaluate(
						( image: HTMLImageElement ) =>
							image.complete && image.naturalWidth > 0
					)
			)
			.toBe( true );
		// A click selects the block the way a user does before dragging it.
		await outside.click();

		await gridDragUtils.drag(
			await gridDragUtils.getCenter( outside ),
			await gridDragUtils.getCellCenter( grid, {
				columnCount: 3,
				rowCount: 2,
				column: 3,
				row: 2,
			} ),
			{
				// The drop layer shows once the grid has seen the drag.
				beforeDrop: () =>
					expect( gridDragUtils.allowedDropLayer ).toBeAttached(),
			}
		);

		// The drop moves the block into the grid before its `dragend`, which
		// then never reaches the canvas. The drag has to end all the same, or
		// the drop layer keeps taking every click on the grid.
		await expect( gridImages ).toHaveCount( 3 );
		await expect.poll( () => isDraggingBlocks( page ) ).toBe( false );
		await expect( gridDragUtils.draggingBlockTools ).toHaveCount( 0 );

		const otherImage = gridImages.filter( {
			has: editor.canvas.getByRole( 'img', { name: 'one' } ),
		} );
		await otherImage.click();
		await expect( otherImage ).toHaveClass( /is-selected/ );
	} );

	test( 'drags the whole multi-selection', async ( {
		editor,
		page,
		gridDragUtils,
	} ) => {
		await editor.setContent( IMAGES_GRID );
		const images = editor.canvas.getByRole( 'document', {
			name: 'Block: Image',
		} );
		await editor.selectBlocks( images.first(), images.last() );

		const from = await gridDragUtils.getCenter( images.first() );
		await gridDragUtils.drag(
			from,
			{ x: from.x + 40, y: from.y + 200 },
			{
				beforeDrop: () =>
					expect
						.poll( () =>
							page.evaluate(
								() =>
									( window as any ).wp.data
										.select( 'core/block-editor' )
										.getDraggedBlockClientIds().length
							)
						)
						.toBe( 2 ),
			}
		);
	} );

	test( 'moves a block dropped by the grid item drag handle', async ( {
		editor,
		page,
		gridDragUtils,
	} ) => {
		await editor.setContent( PARAGRAPH_GRID );
		const grid = editor.canvas.getByRole( 'document', {
			name: 'Block: Canvas',
		} );
		const paragraph = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		await editor.selectBlocks( paragraph );

		const handle = page.locator( '.block-editor-grid-item-handles__drag' );
		await expect( handle ).toBeVisible();
		const cell = { columnCount: 4, rowCount: 3, column: 3, row: 2 };
		const landing = await gridDragUtils.drag(
			await gridDragUtils.getCenter( handle ),
			await gridDragUtils.getCellCenter( grid, cell )
		);

		await gridDragUtils.expectToLandOnPreview( paragraph, landing );
		// The block keeps where it was grabbed, so its handle is where the
		// drag was let go.
		await expect( handle ).toBeVisible();
		await gridDragUtils.expectCenterInCell( handle, grid, cell );
	} );

	test( 'inserts a block dragged from the inserter where it is dropped', async ( {
		editor,
		gridDragUtils,
	} ) => {
		await editor.setContent( PARAGRAPH_GRID );
		const grid = editor.canvas.getByRole( 'document', {
			name: 'Block: Canvas',
		} );

		const landing = await gridDragUtils.dragFromInserter(
			'Paragraph',
			await gridDragUtils.getPoint( grid, { x: 0.85, y: 0.8 } ),
			{
				beforeDrop: () =>
					expect( gridDragUtils.allowedDropLayer ).toBeAttached(),
			}
		);

		// The inserted Paragraph is empty.
		const insertedParagraph = grid.getByRole( 'document', {
			name: /^Empty block/,
		} );
		await expect( insertedParagraph ).toBeVisible();
		await gridDragUtils.expectToLandOnPreview( insertedParagraph, landing );
	} );

	test( 'does not show the drop layer for a block the grid does not allow', async ( {
		editor,
		gridDragUtils,
	} ) => {
		await editor.setContent(
			getGridMarkup( {
				columnCount: 4,
				rowCount: 3,
				content: PARAGRAPH_GRID_CONTENT,
				attributes: { allowedBlocks: [ 'core/image' ] },
			} )
		);
		const grid = editor.canvas.getByRole( 'document', {
			name: 'Block: Canvas',
		} );

		await gridDragUtils.dragFromInserter(
			'Paragraph',
			await gridDragUtils.getPoint( grid, { x: 0.85, y: 0.8 } ),
			{
				beforeDrop: async () => {
					// The block tools know about the drag, so the grid has
					// seen it too.
					await expect(
						gridDragUtils.draggingBlockTools
					).toBeVisible();
					await expect( gridDragUtils.allowedDropLayer ).toHaveCount(
						0
					);
				},
			}
		);

		await expect(
			grid.getByRole( 'document', { name: 'Block: Paragraph' } )
		).toHaveCount( 1 );
	} );

	test( 'does not show the drop layer for a file dragged from the desktop', async ( {
		editor,
		gridDragUtils,
	} ) => {
		await editor.setContent( PARAGRAPH_GRID );
		const grid = editor.canvas.getByRole( 'document', {
			name: 'Block: Canvas',
		} );

		const fileDrag = await gridDragUtils.dragFile(
			await gridDragUtils.getPoint( grid, { x: 0.85, y: 0.8 } )
		);
		await expect( gridDragUtils.draggingBlockTools ).toBeVisible();
		await expect( gridDragUtils.allowedDropLayer ).toHaveCount( 0 );
		await fileDrag.end();
	} );

	test( 'clears the drop layer when the inserter closes mid-drag', async ( {
		editor,
		page,
		gridDragUtils,
	} ) => {
		await editor.setContent( PARAGRAPH_GRID );
		const grid = editor.canvas.getByRole( 'document', {
			name: 'Block: Canvas',
		} );
		const gridCenter = await gridDragUtils.getPoint( grid, {
			x: 0.6,
			y: 0.5,
		} );

		await gridDragUtils.dragFromInserter(
			'Paragraph',
			await gridDragUtils.getPoint( grid, { x: 0.85, y: 0.8 } ),
			{
				beforeDrop: async () => {
					await expect(
						gridDragUtils.allowedDropLayer
					).toBeAttached();
					await page.evaluate( () =>
						( window as any ).wp.data
							.dispatch( 'core/editor' )
							.setIsInserterOpened( false )
					);
					await expect(
						page.getByRole( 'region', { name: 'Block Library' } )
					).toBeHidden();
					await page.mouse.move( gridCenter.x, gridCenter.y, {
						steps: 5,
					} );
				},
			}
		);
		const gridBox = await gridDragUtils.getBox( grid );
		await page.mouse.move(
			gridBox.x + gridBox.width / 2,
			gridBox.y + gridBox.height + 60,
			{ steps: 5 }
		);

		await expect( gridDragUtils.allowedDropLayer ).toHaveCount( 0 );
		await expect( gridDragUtils.draggingBlockTools ).toHaveCount( 0 );
	} );

	test( 'lets a file dragged over an empty cell of a selected grid reach the canvas', async ( {
		editor,
		page,
		gridDragUtils,
	} ) => {
		await editor.setContent( PARAGRAPH_GRID );
		const grid = editor.canvas.getByRole( 'document', {
			name: 'Block: Canvas',
		} );
		await editor.selectBlocks( grid );
		const emptyCell = await gridDragUtils.getCellCenter( grid, {
			columnCount: 4,
			rowCount: 3,
			column: 4,
			row: 3,
		} );

		const fileDrag = await gridDragUtils.dragFile( emptyCell );
		await expect( gridDragUtils.draggingBlockTools ).toBeVisible();
		// Nothing over the canvas, such as the grid's cell inserters, takes
		// the file before the canvas can.
		expect(
			await page.evaluate(
				( { x, y } ) =>
					document.elementFromPoint( x, y ) ===
					document.querySelector( 'iframe[name="editor-canvas"]' ),
				emptyCell
			)
		).toBe( true );
		await fileDrag.end();
	} );
} );

class GridDragUtils {
	page: Page;
	editor: Editor;
	draggingBlockTools: Locator;
	allowedDropLayer: Locator;
	landingPreview: Locator;

	constructor( { page, editor }: { page: Page; editor: Editor } ) {
		this.page = page;
		this.editor = editor;

		this.draggingBlockTools = this.page.locator(
			'.block-editor-block-tools--is-dragging'
		);
		this.allowedDropLayer = this.page.locator(
			'.block-editor-grid-visualizer.is-dropping-allowed'
		);
		this.landingPreview = this.page.locator(
			'.block-editor-grid-visualizer__landing'
		);
	}

	async getBox( locator: Locator ): Promise< Box > {
		const box = await locator.boundingBox();
		if ( ! box ) {
			throw new Error( 'The element has no bounding box.' );
		}
		return box;
	}

	async getPoint( locator: Locator, { x, y }: Point ): Promise< Point > {
		const box = await this.getBox( locator );
		return { x: box.x + box.width * x, y: box.y + box.height * y };
	}

	getCenter( locator: Locator ) {
		return this.getPoint( locator, { x: 0.5, y: 0.5 } );
	}

	getCellCenter(
		grid: Locator,
		{ columnCount, rowCount, column, row }: Cell
	) {
		return this.getPoint( grid, {
			x: ( column - 0.5 ) / columnCount,
			y: ( row - 0.5 ) / rowCount,
		} );
	}

	/**
	 * Drags with the mouse, and returns where the grid showed the block
	 * would land, just before the drop.
	 *
	 * @param from               Where the drag starts.
	 * @param to                 Where the drag ends.
	 * @param options
	 * @param options.beforeDrop Called just before the drop.
	 *
	 * @return The landing preview's box, if shown.
	 */
	async drag(
		from: Point,
		to: Point,
		{ beforeDrop }: DragOptions = {}
	): Promise< Box | null > {
		await this.page.mouse.move( from.x, from.y );
		await this.page.mouse.down();
		// A few small moves start the browser's drag and drop.
		await this.page.mouse.move( from.x + 5, from.y + 5, { steps: 5 } );
		await this.page.mouse.move( to.x, to.y, { steps: 20 } );
		await beforeDrop?.();
		// The grid follows the pointer once per animation frame.
		await this.page.evaluate(
			() =>
				new Promise( ( resolve ) =>
					window.requestAnimationFrame( () =>
						window.requestAnimationFrame( resolve )
					)
				)
		);
		const landing = ( await this.landingPreview.count() )
			? await this.landingPreview.boundingBox()
			: null;
		await this.page.mouse.up();
		// A real mouse moves on after the release.
		await this.page.mouse.move( to.x + 15, to.y + 15, { steps: 3 } );
		return landing;
	}

	async dragFromInserter(
		blockTitle: string,
		to: Point,
		options?: DragOptions
	) {
		await this.page
			.getByRole( 'button', { name: 'Block Inserter', exact: true } )
			.click();
		const blockLibrary = this.page.getByRole( 'region', {
			name: 'Block Library',
		} );
		await blockLibrary
			.getByRole( 'searchbox', { name: 'Search' } )
			.fill( blockTitle );
		const item = blockLibrary
			.getByRole( 'listbox', { name: 'Blocks' } )
			.getByRole( 'option', { name: blockTitle, exact: true } );
		return this.drag( await this.getCenter( item ), to, options );
	}

	/**
	 * Drags an image file, as from the desktop, over a point of the canvas.
	 * Playwright can't drag files in every browser, so this fires the drag
	 * events itself.
	 *
	 * @param point The point, in the page.
	 *
	 * @return The drag, to end it.
	 */
	async dragFile( point: Point ) {
		const dragHandle = await this.page.evaluateHandle( ( { x, y } ) => {
			// The canvas is an iframe, with a document and an element under
			// the point.
			const iframe = document.querySelector< HTMLIFrameElement >(
				'iframe[name="editor-canvas"]'
			)!;
			const frame = iframe.getBoundingClientRect();
			const doc = iframe.contentDocument!;
			const clientX = x - frame.left;
			const clientY = y - frame.top;
			const target = doc.elementFromPoint( clientX, clientY )!;
			const dataTransfer = new DataTransfer();
			dataTransfer.items.add(
				new File( [ 'x' ], 'photo.png', { type: 'image/png' } )
			);
			const fire = ( type: string ) =>
				target.dispatchEvent(
					new DragEvent( type, {
						bubbles: true,
						cancelable: true,
						dataTransfer,
						clientX,
						clientY,
					} )
				);
			fire( 'dragenter' );
			fire( 'dragover' );
			// A browser fires `dragover` again and again while the
			// pointer is still.
			const interval = setInterval( () => fire( 'dragover' ), 50 );
			return {
				end() {
					clearInterval( interval );
					fire( 'dragleave' );
					doc.dispatchEvent(
						new DragEvent( 'dragend', { bubbles: true } )
					);
				},
			};
		}, point );
		return {
			end: () => dragHandle.evaluate( ( drag ) => drag.end() ),
		};
	}

	/**
	 * Expects a dropped block to be where the grid showed it would land.
	 *
	 * @param block   The block.
	 * @param landing The landing preview's box, before the drop.
	 */
	async expectToLandOnPreview( block: Locator, landing: Box | null ) {
		if ( ! landing ) {
			throw new Error( 'The grid showed no landing preview.' );
		}
		await expect
			.poll( async () => {
				const box = await this.getBox( block );
				return Math.max(
					...( [ 'x', 'y', 'width', 'height' ] as const ).map(
						( key ) => Math.abs( box[ key ] - landing[ key ] )
					)
				);
			} )
			.toBeLessThanOrEqual( 1 );
	}

	async expectCenterInCell(
		block: Locator,
		grid: Locator,
		{ columnCount, rowCount, column, row }: Cell
	) {
		const center = await this.getCenter( block );
		const gridBox = await this.getBox( grid );
		expect(
			Math.ceil(
				( ( center.x - gridBox.x ) / gridBox.width ) * columnCount
			)
		).toBe( column );
		expect(
			Math.ceil(
				( ( center.y - gridBox.y ) / gridBox.height ) * rowCount
			)
		).toBe( row );
	}
}
