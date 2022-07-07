/**
 * WordPress dependencies
 */
import { visitAdminPage } from '@wordpress/e2e-test-utils';

async function getOptionsValues( selector ) {
	await visitAdminPage( 'options.php' );
	return page.evaluate( ( theSelector ) => {
		const inputs = Array.from( document.querySelectorAll( theSelector ) );
		return inputs.reduce( ( memo, input ) => {
			memo[ input.id ] = input.value;
			return memo;
		}, {} );
	}, selector );
}

// It might make sense to include a similar test in WP core (or move this one over).
// See discussion here: https://github.com/WordPress/gutenberg/pull/32797#issuecomment-864192088.
describe( 'Settings', () => {
	test( 'Regression: updating a specific option will only change its value and will not corrupt others', async () => {
		// We won't select the option that we updated and will also remove some
		// _transient options that seem to change at every update.
		const optionsInputsSelector =
			'form#all-options table.form-table input:not([id*="_transient"]):not([id="blogdescription"])';
		const optionsBefore = await getOptionsValues( optionsInputsSelector );

		await visitAdminPage( 'options-general.php' );
		await page.type(
			'input#blogdescription',
			'Just another Gutenberg site'
		);
		await page.click( 'input#submit' );

		const optionsAfter = await getOptionsValues( optionsInputsSelector );

		Object.entries( optionsBefore ).forEach( ( optionBefore ) => {
			const [ id ] = optionBefore;
			const optionAfter = [ id, optionsAfter[ id ] ];
			expect( optionAfter ).toStrictEqual( optionBefore );
		} );
	} );
} );
