/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	toolbarUtils: async ( { page, pageUtils }, use ) => {
		await use( new ToolbarUtils( { page, pageUtils } ) );
	},
} );

test.describe( 'Block Toolbar', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.describe( 'Contextual Toolbar', () => {
		test( 'should not scroll page', async ( { page, toolbarUtils } ) => {
			while (
				await page.evaluate( () => {
					const { activeElement } =
						document.activeElement?.contentDocument ?? document;
					const scrollable =
						window.wp.dom.getScrollContainer( activeElement );
					return ! scrollable || scrollable.scrollTop === 0;
				} )
			) {
				await page.keyboard.press( 'Enter' );
			}

			await page.keyboard.type( 'a' );

			const scrollTopBefore = await page.evaluate( () => {
				const { activeElement } =
					document.activeElement?.contentDocument ?? document;
				window.scrollContainer =
					window.wp.dom.getScrollContainer( activeElement );
				return window.scrollContainer.scrollTop;
			} );

			await toolbarUtils.moveToToolbarShortcut();
			expect( await toolbarUtils.isInBlockToolbar() ).toBe( true );

			const scrollTopAfter = await page.evaluate( () => {
				return window.scrollContainer.scrollTop;
			} );
			expect( scrollTopBefore ).toBe( scrollTopAfter );
		} );
	} );
} );

class ToolbarUtils {
	constructor( { page, pageUtils } ) {
		this.page = page;
		this.pageUtils = pageUtils;
	}

	async moveToToolbarShortcut() {
		await this.pageUtils.pressKeys( 'alt+F10' );
	}

	async isInBlockToolbar() {
		return await this.page.evaluate( () => {
			return !! document.activeElement.closest(
				'.block-editor-block-toolbar'
			);
		} );
	}
}
