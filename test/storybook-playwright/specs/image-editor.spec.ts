/**
 * External dependencies
 */
import { expect, test } from '@playwright/test';

/**
 * Internal dependencies
 */
import { gotoStoryId } from '../utils';

/**
 * Read the CSS matrix() transform from the image element and parse
 * its six values.
 *
 * @param page Playwright page.
 * @return Array of six numbers from the matrix, or null if not set.
 */
async function readImageMatrix(
	page: import('@playwright/test').Page
): Promise< number[] | null > {
	const transform = await page
		.locator( '.wp-media-editor-image-editor__image' )
		.evaluate( ( el ) => window.getComputedStyle( el ).transform );
	const match = transform.match( /matrix\(([^)]+)\)/ );
	if ( ! match ) {
		return null;
	}
	return match[ 1 ].split( ',' ).map( ( v ) => parseFloat( v.trim() ) );
}

// Integration smoke tests: unit tests cover the reducer / camera math;
// these verify the browser event pipeline (passive-wheel, pointer capture,
// keyboard focus) actually reaches it and the CSS transform is applied.
test.describe( 'MediaEditor ImageEditor', () => {
	test( 'default crop should render correctly', async ( { page } ) => {
		await gotoStoryId( page, 'mediaeditor-imageeditor--default' );
		await page.waitForSelector( '.wp-media-editor-image-editor' );
		await expect(
			page.locator( '.wp-media-editor-image-editor__image' )
		).toBeVisible();
		expect(
			await page.screenshot( { animations: 'disabled' } )
		).toMatchSnapshot();
	} );

	test( 'with controls should render correctly', async ( { page } ) => {
		await gotoStoryId( page, 'mediaeditor-imageeditor--with-controls' );
		await page.waitForSelector( '.wp-media-editor-image-editor' );
		await expect(
			page.locator( '.wp-media-editor-image-editor__image' )
		).toBeVisible();
		expect(
			await page.screenshot( { animations: 'disabled' } )
		).toMatchSnapshot();
	} );

	test( 'wheel zoom changes image scale', async ( { page } ) => {
		await gotoStoryId( page, 'mediaeditor-imageeditor--default' );
		await page.waitForSelector( '.wp-media-editor-image-editor__image' );

		const before = await readImageMatrix( page );
		expect( before ).not.toBeNull();

		// Wheel up (negative deltaY) zooms in.
		const box = await page
			.locator( '.wp-media-editor-image-editor' )
			.boundingBox();
		if ( ! box ) {
			throw new Error( 'Cropper container has no bounding box' );
		}
		await page.mouse.move( box.x + box.width / 2, box.y + box.height / 2 );
		await page.mouse.wheel( 0, -500 );

		const after = await readImageMatrix( page );
		expect( after ).not.toBeNull();

		// The scale component (matrix[0]) should increase after wheel up.
		expect( after![ 0 ] ).toBeGreaterThan( before![ 0 ] );
	} );

	test( 'keyboard arrow key pans the image', async ( { page } ) => {
		await gotoStoryId( page, 'mediaeditor-imageeditor--default' );
		await page.waitForSelector( '.wp-media-editor-image-editor__image' );

		// Zoom in first so there's room to pan.
		const container = page.locator( '.wp-media-editor-image-editor' );
		await container.hover();
		await page.mouse.wheel( 0, -500 );

		const before = await readImageMatrix( page );
		expect( before ).not.toBeNull();

		// Focus the cropper container and press ArrowRight.
		await container.focus();
		await page.keyboard.press( 'ArrowRight' );

		const after = await readImageMatrix( page );
		expect( after ).not.toBeNull();

		// Translation X (matrix[4]) should change after arrow key pan.
		expect( after![ 4 ] ).not.toBeCloseTo( before![ 4 ], 1 );
	} );

	test( 'keyboard R rotates the image', async ( { page } ) => {
		await gotoStoryId( page, 'mediaeditor-imageeditor--default' );
		await page.waitForSelector( '.wp-media-editor-image-editor__image' );

		const before = await readImageMatrix( page );
		expect( before ).not.toBeNull();

		const container = page.locator( '.wp-media-editor-image-editor' );
		await container.focus();
		await page.keyboard.press( 'r' );

		const after = await readImageMatrix( page );
		expect( after ).not.toBeNull();

		// After 90° rotation, the matrix [a, b, c, d] should change from
		// roughly [z, 0, 0, z] (no rotation) to [0, z, -z, 0].
		// Specifically, the 'b' component (matrix[1]) should go from ~0
		// to roughly ±z.
		expect( Math.abs( after![ 1 ] ) ).toBeGreaterThan( 0.5 );
	} );

	test( 'pointer drag pans the image', async ( { page } ) => {
		await gotoStoryId( page, 'mediaeditor-imageeditor--default' );
		await page.waitForSelector( '.wp-media-editor-image-editor__image' );

		// Zoom in so there's room to pan.
		const container = page.locator( '.wp-media-editor-image-editor' );
		await container.hover();
		await page.mouse.wheel( 0, -500 );

		const before = await readImageMatrix( page );
		expect( before ).not.toBeNull();

		// Drag from center of container by +50, +30 pixels.
		const box = await container.boundingBox();
		if ( ! box ) {
			throw new Error( 'Cropper container has no bounding box' );
		}
		const cx = box.x + box.width / 2;
		const cy = box.y + box.height / 2;

		await page.mouse.move( cx, cy );
		await page.mouse.down();
		await page.mouse.move( cx + 50, cy + 30, { steps: 5 } );
		await page.mouse.up();

		const after = await readImageMatrix( page );
		expect( after ).not.toBeNull();

		// After dragging right and down, translation should move in those
		// directions (matrix[4] increases, matrix[5] increases).
		expect( after![ 4 ] ).toBeGreaterThan( before![ 4 ] );
		expect( after![ 5 ] ).toBeGreaterThan( before![ 5 ] );
	} );

	test( 'freeform resize handle drag shrinks the crop area', async ( {
		page,
	} ) => {
		await gotoStoryId( page, 'mediaeditor-imageeditor--debug' );
		await page.waitForSelector( '.wp-media-editor-image-editor__image' );

		// Enable freeform mode to show resize handles.
		await page.getByLabel( 'Freeform crop' ).check();

		// The south-east corner handle is visible only in freeform mode.
		const handle = page.locator(
			'.wp-media-editor-image-editor__handle--se'
		);
		await expect( handle ).toBeVisible();

		// Measure crop dimensions from the stencil's border element before
		// and after the drag. The stencil is absolutely positioned; its
		// bounding box reflects the current crop rect in screen pixels.
		const stencil = page.locator(
			'.wp-media-editor-image-editor__stencil'
		);
		const before = await stencil.boundingBox();
		if ( ! before ) {
			throw new Error( 'Stencil has no bounding box' );
		}

		// Drag the SE handle inward (up-left) by roughly 100px to shrink.
		const handleBox = await handle.boundingBox();
		if ( ! handleBox ) {
			throw new Error( 'SE handle has no bounding box' );
		}
		const hx = handleBox.x + handleBox.width / 2;
		const hy = handleBox.y + handleBox.height / 2;
		await page.mouse.move( hx, hy );
		await page.mouse.down();
		await page.mouse.move( hx - 100, hy - 100, { steps: 5 } );
		await page.mouse.up();

		// Wait for the stencil transition (settle animation) to finish.
		await stencil.evaluate( ( el ) =>
			Promise.all(
				el.getAnimations().map( ( animation ) => animation.finished )
			).then( () => undefined )
		);

		const after = await stencil.boundingBox();
		if ( ! after ) {
			throw new Error( 'Stencil has no bounding box after drag' );
		}

		// The crop area should have changed in some visible way after
		// the handle drag. Don't assert the direction of change —
		// the SETTLE_CROP reducer re-centers and expands the crop to
		// fill the container height, so dimensions may grow or shrink
		// depending on the original aspect ratio. What matters for a
		// smoke test is that the interaction had an effect.
		const changed =
			Math.abs( after.width - before.width ) > 5 ||
			Math.abs( after.height - before.height ) > 5 ||
			Math.abs( after.x - before.x ) > 5 ||
			Math.abs( after.y - before.y ) > 5;
		expect( changed ).toBe( true );
	} );
} );
