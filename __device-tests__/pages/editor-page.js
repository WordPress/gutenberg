/**
 * @flow
 * @format
 * */
/**
 * External dependencies
 */
import wd from 'wd';
/**
 * Internal dependencies
 */
import BlockInteraction from '../blocks/block-interaction';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { isAndroid } from '../helpers/utils';

export default class EditorPage {
	driver: wd.PromiseChainWebdriver;

	constructor( driver: wd.PromiseChainWebdriver ) {
		this.driver = driver;
		this.accessibilityIdKey = 'name';
		this.accessibilityIdXPathAttrib = 'name';

		if ( isAndroid() ) {
			this.accessibilityIdXPathAttrib = 'content-desc';
			this.accessibilityIdKey = 'contentDescription';
		}
	}

	async expect( ) {
		expect( await this.driver.hasElementByAccessibilityId( 'block-list' ) ).toBe( true );
		return this;
	}

	async addNewBlock( blockName: string ) {
		// Click add button
		const addButton = await this.driver.elementByAccessibilityId( __( 'Add block' ) );
		await addButton.click();

		// Click on block of choice
		const blockButton = await this.driver.elementByAccessibilityId( blockName );
		await blockButton.click();
	}

	// Finds the wd element for new block that was added and sets the element attribute
	// and accessibilityId attributes on this object
	async getBlockAtPosition( position: number, blockName: string ) {
		await this.driver.sleep( 2000 );
		const blockLocator = `block-${ position }-${ blockName }`;
		return await this.driver.elementByAccessibilityId( blockLocator );
	}

	// Paragraph Block functions

	async addNewParagraphBlock() {
		await this.addNewBlock( 'Paragraph' );
	}

	async getParagraphBlockAtPosition( position: number ) {
		await this.driver.sleep( 2000 );
		const blockName = 'core/paragraph';
		return this.getBlockAtPosition( position, blockName );
	}

	async getTextViewForParagraphBlock( block: wd.Element ) {
		await this.driver.sleep( 2000 );
		let textViewElement = 'XCUIElementTypeTextView';
		if ( isAndroid() ) {
			textViewElement = 'android.widget.EditText';
		}
		const blockLocator = `//*[@${ this.accessibilityIdXPathAttrib }="${ this.accessibilityId }"]//${ textViewElement }`;
		this.textViewElement = await this.driver.elementByXPath( blockLocator );
	}
}
