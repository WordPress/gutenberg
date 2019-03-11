/** @flow
 * @format */

export default class EditorPage {
	constructor( driver ) {
		this.driver = driver;
	}

	static async Expect( driver ): EditorPage {
		const page = new this( driver );
		expect( await driver.hasElementByAccessibilityId( 'block-list' ) ).toBe( true );
		return page;
	}

	async addNewBlock( block ) {
		const blockName = block.name;

		// Click add button
		const addButton = await this.driver.elementByAccessibilityId( 'Add block' );
		await addButton.click();

		// Click on block
		const blockButton = await this.driver.elementByAccessibilityId( blockName );
		await blockButton.click();
		await block.setup();

		return block;
	}
}
