export default class EditorPage {
    constructor( driver ) {
        this.driver = driver;
    }

    static async Expect( driver ) {
        const page = new this(driver);
        await driver.hasElementByAccessibilityId( 'block-list' );
        return page;
    }

    static async addNewBlock( block ) {
        const blockName = block.name;
        console.log(`Add a new ${blockName} block`);

		// Click add button
		let addButton = await driver.elementByAccessibilityId('Add block');
		await addButton.click();

		// Click on block 
		let blockButton = await driver.elementByAccessibilityId(blockName);
        await blockButton.click();
        await block.setup();

		return block;
    }
}