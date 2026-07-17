/**
 * External dependencies
 */
import { expect, test } from '@playwright/test';

/**
 * Internal dependencies
 */
import { gotoStoryId } from '../utils';

test.describe( 'Modal', () => {
	test( 'preserves consumer overrides loaded before the component styles', async ( {
		page,
	} ) => {
		await gotoStoryId( page, 'components-modal--default' );

		await page.evaluate( () => {
			const style = document.createElement( 'style' );
			style.textContent = `
				.components-modal__screen-overlay {
					z-index: 999999;
				}
				.modal-consumer-overlay {
					display: block;
				}
				.modal-consumer-frame {
					width: 480px;
				}
			`;
			document.head.prepend( style );
		} );

		await page.getByRole( 'button', { name: 'Open Modal' } ).click();

		const overlay = page.locator( '.components-modal__screen-overlay' );
		const frame = page.locator( '.components-modal__frame' );

		await overlay.evaluate( ( element ) =>
			element.classList.add( 'modal-consumer-overlay' )
		);
		await frame.evaluate( ( element ) =>
			element.classList.add( 'modal-consumer-frame' )
		);

		await expect( overlay ).toHaveCSS( 'z-index', '999999' );
		await expect( overlay ).toHaveCSS( 'display', 'block' );
		await expect( frame ).toHaveCSS( 'width', '480px' );
	} );
} );
