/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

async function getOptionsValues( selector, admin, page ) {
	await admin.visitAdminPage( 'options.php' );
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
test.describe( 'Settings', () => {
	test( 'Regression: updating a specific option will only change its value and will not corrupt others', async ( {
		page,
		admin,
	} ) => {
		// We won't select the option that we updated and will also remove some
		// _transient options that seem to change at every update.
		const optionsInputsSelector =
			'form#all-options table.form-table input:not([id*="_transient"]):not([id="blogdescription"])';
		const optionsBefore = await getOptionsValues(
			optionsInputsSelector,
			admin,
			page
		);

		await admin.visitAdminPage( 'options-general.php' );
		await page
			.getByRole( 'textbox', { name: 'Tagline' } )
			.fill( 'Just another Gutenberg site' );
		await page.getByRole( 'button', { name: 'Save Changes' } ).click();

		const optionsAfter = await getOptionsValues(
			optionsInputsSelector,
			admin,
			page
		);

		Object.entries( optionsBefore ).forEach( ( optionBefore ) => {
			const [ id ] = optionBefore;
			const optionAfter = [ id, optionsAfter[ id ] ];
			expect( optionAfter ).toStrictEqual( optionBefore );
		} );
	} );
} );
