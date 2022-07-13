/**
 * Internal dependencies
 */
import type { Admin } from './';

export async function setOption( this: Admin, setting: string, value: string ) {
	await this.visitAdminPage( 'options.php', '' );
	const previousValue = await this.page.inputValue( `#${ setting }` );

	await this.page.fill( `#${ setting }`, value );

	await this.page.click( '#Update' );
	return previousValue;
}
