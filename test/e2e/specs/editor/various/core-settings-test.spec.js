/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use({
	settingUtils: async ({ page, admin, requestUtils }, use) => {
		await use(new SettingUtils({ page, admin, requestUtils }));
	},
});
test.describe( 'Settings', () => {

	test('Regression: updating a specific option will only change its value and will not corrupt others', async ( {
		page,
		admin,
		settingUtils
	} ) => {
		
		const optionsInputsSelector =
			'form#all-options table.form-table input:not([id*="_transient"]):not([id="blogdescription"])';
		const optionsBefore = await settingUtils.getOptionsValues(optionsInputsSelector);

		await admin.visitAdminPage('options-general.php');
		await page.type(
			'input#blogdescription',
			'Just another Gutenberg site'
		);
		await page.click('role=button[name="Save Changes"i]');

		const optionsAfter = await settingUtils.getOptionsValues(optionsInputsSelector);

		Object.entries(optionsBefore).forEach((optionBefore) => {
			const [id] = optionBefore;
			const optionAfter = [id, optionsAfter[id]];
			expect(optionAfter).toStrictEqual(optionBefore);
		});
	} );
} );

class SettingUtils {
	constructor({ page, admin }) {
		this.page = page;
		this.admin = admin;	
	}

	async  getOptionsValues(selector) {
		await this.admin.visitAdminPage('options.php');
	return this.page.evaluate((theSelector) => {
		const inputs = Array.from(document.querySelectorAll(theSelector));
		return inputs.reduce((memo, input) => {
			memo[input.id] = input.value;
			return memo;
		}, {});
	}, selector);
}
}
