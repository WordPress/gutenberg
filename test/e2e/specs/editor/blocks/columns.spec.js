/**
 * WordPress dependencies
 */
const { test, expect } = require('@wordpress/e2e-test-utils-playwright');

test.describe('Columns', () => {
	test.beforeEach(async ({ admin }) => {
		await admin.createNewPost();
	});

	test.afterEach(async ({ requestUtils }) => {
		await requestUtils.deleteAllPosts();
	});

	test('restricts all blocks inside the columns block', async ({
		page,
		editor,
	}) => {
		// Open Columns
		await editor.insertBlock({ name: 'core/columns' });
		await page.locator('[aria-label="Two columns; equal split"]').click();

		// Open List view toggle
		await page.locator('role=button[name="List View"i]').click();

		// block column add
		await page
			.locator(
				'[aria-label="Block navigation structure"] >> text=Column'
			)
			.nth(1)
			.click();

		// Toggle Block inserter
		await page
			.locator('role=button[name="Toggle block inserter"i]')
			.click();

		// Verify Column
		await page.waitForTimeout(500);
		const inserterItemTitles = await page.evaluate(() => {
			return Array.from(
				document.querySelectorAll(
					'.block-editor-block-types-list__item-title'
				)
			).map((inserterItem) => {
				return inserterItem.innerText;
			});
		});
		expect(inserterItemTitles).toHaveLength(1);

		//expect(await getBlockFunction.get_list_all_block()).toHaveLength(1);
	});
});
