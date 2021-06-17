/**
 * WordPress dependencies
 */
import { visitAdminPage } from '@wordpress/e2e-test-utils';
/**
 * Internal dependencies
 */

async function getOptionsValues() {
	await visitAdminPage( 'options.php' );
	return page.evaluate( () => {
		const inputs = Array.from(
			document.querySelectorAll(
				'form#all-options table.form-table input'
			)
		);
		return inputs.reduce( ( memo, input ) => {
			memo.push( [ input.id, input.value ] );
			return memo;
		}, [] );
	} );
}

describe( 'Settings', () => {
	test( 'Regression: updating settings will not corrupt options data', async () => {
		const optionsBefore = await getOptionsValues();

		await visitAdminPage( 'options-general.php' );
		await page.type(
			'input#blogdescription',
			'Just another Gutenberg site'
		);
		await page.click( 'input#submit' );

		const optionsAfter = await getOptionsValues();

		const pairs = optionsBefore.reduce( ( memo, beforePair, i ) => {
			memo.push( [ beforePair, optionsAfter[ i ] ] );
			return memo;
		}, [] );

		pairs.forEach( ( [ beforePair, afterPair ] ) =>
			expect( beforePair ).toStrictEqual( afterPair )
		);
	} );
} );
