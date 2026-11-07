import { test, expect } from '@wordpress/e2e-test-utils-playwright';

// Whether the run targets the extensible site editor (v2).
const isSiteEditorV2 = !! process.env.GUTENBERG_E2E_SITE_EDITOR_V2;

test.describe( 'Resizable frame', () => {
	test.skip(
		isSiteEditorV2,
		'The extensible site editor does not render the resizable frame.'
	);

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'keeps its width after being resized with the mouse', async ( {
		admin,
		page,
	} ) => {
		await admin.visitSiteEditor();

		const frame = page.locator( '.edit-site-resizable-frame__inner' );
		const getFrameWidth = () =>
			frame.evaluate(
				( element ) => element.getBoundingClientRect().width
			);
		await frame.hover();

		const handle = page.getByRole( 'separator', {
			name: 'Drag to resize',
		} );
		await expect( handle ).toBeVisible();

		const initialWidth = await getFrameWidth();
		const handleBox = await handle.boundingBox();
		if ( ! handleBox ) {
			throw new Error( 'Resize handle bounding box not available' );
		}
		const handleX = handleBox.x + handleBox.width / 2;
		const handleY = handleBox.y + handleBox.height / 2;

		await page.mouse.move( handleX, handleY );
		await page.mouse.down();
		await page.mouse.move( handleX + 100, handleY, { steps: 10 } );

		const resizedWidth = await getFrameWidth();
		expect( resizedWidth ).toBeLessThan( initialWidth );

		await page.mouse.up();
		await expect( frame ).not.toContainClass( 'is-resizing' );
		expect( await getFrameWidth() ).toBeCloseTo( resizedWidth, 0 );
	} );
} );
