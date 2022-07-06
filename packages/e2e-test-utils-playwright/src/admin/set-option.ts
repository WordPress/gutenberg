/**
 * Internal dependencies
 */
import type { Admin } from './';

export async function setOption( this: Admin, setting: string, value: string ) {
	await this.visitAdminPage( 'options.php', '' );
	await this.page.waitForSelector( `#${ setting }` );
	const previousValue = await this.page.inputValue( `#${ setting }` );

	await this.page.focus( `#${ setting }` );
	await this.pageUtils.pressKeyWithModifier( 'primary', 'a' );
	await this.page.type( `#${ setting }`, value );

	await Promise.all( [
		this.page.click( '#Update' ),
		this.page.waitForNavigation( { waitUntil: 'networkidle' } ),
	] );
	return previousValue;
}
