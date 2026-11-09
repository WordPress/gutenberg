import { expect, test } from '@playwright/test';
import { gotoStoryId } from '../utils';

test( 'keeps pressed header buttons filled in forced colors', async ( {
	page,
} ) => {
	await page.emulateMedia( { forcedColors: 'active' } );
	await gotoStoryId( page, 'editor-header-toolbars--pressed' );
	const systemColors = await page.evaluate( () => {
		const probe = document.createElement( 'span' );
		probe.style.forcedColorAdjust = 'none';
		document.body.append( probe );
		const colors = [ 'SelectedItem', 'GrayText' ].map( ( color ) => {
			probe.style.backgroundColor = color;
			return getComputedStyle( probe ).backgroundColor;
		} );
		probe.remove();
		return colors;
	} );
	for ( const name of [ 'Editor', 'Widgets', 'Customizer' ] ) {
		const toolbar = page.getByRole( 'toolbar', { name, exact: true } );
		await expect(
			toolbar.getByRole( 'button', { name: 'Enabled', exact: true } )
		).toHaveCSS( 'background-color', systemColors[ 0 ] );
		await expect(
			toolbar.getByRole( 'button', { name: 'Disabled', exact: true } )
		).toHaveCSS( 'background-color', systemColors[ 1 ] );
	}
} );
