/**
 * @flow
 * @format
 * */
import wd from 'wd';
import Block from '../blocks/block';

export default class EditorPage {
	driver: wd.PromiseChainWebdriver;
	constructor( driver: wd.PromiseChainWebdriver ) {
		this.driver = driver;
	}

	async expect( ) {
		expect( await this.driver.hasElementByAccessibilityId( 'block-list' ) ).toBe( true );
		return this;
	}

	async addNewBlock( block: Block ) {
		const blockName = block.name;

		// Click add button
		const addButton = await this.driver.elementByAccessibilityId( 'Add block' );
		await addButton.click();

		// Click on block of choice
		const blockButton = await this.driver.elementByAccessibilityId( blockName );
		await blockButton.click();
		await block.setup();

		return block;
	}
}
