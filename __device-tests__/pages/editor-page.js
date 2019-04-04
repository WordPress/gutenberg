/**
 * @flow
 * @format
 * */
/**
 * External dependencies
 */
import wd from 'wd';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { isAndroid, typeString } from '../helpers/utils';

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

	// position of the block to move up
	async moveBlockUp( position: number ) {
		const blockLocator = `//*[starts-with(@${ this.accessibilityIdXPathAttrib }, block-${ position })]`;
		const blockElement = await this.driver.elementByXPath( blockLocator );
		const accessibilityId = blockElement.getAttribute( this.accessibilityIdKey );

		const moveUpButton = await this.driver.elementByAccessibilityId( __( `Move ${ accessibilityId } up` ) );
		await moveUpButton.click();
	}

	// position of the block to move down
	async moveBlockDown( position: number ) {
		const blockLocator = `//*[starts-with(@${ this.accessibilityIdXPathAttrib }, block-${ position })]`;
		const blockElement = await this.driver.elementByXPath( blockLocator );
		const accessibilityId = blockElement.getAttribute( this.accessibilityIdKey );

		const moveDownButton = await this.driver.elementByAccessibilityId( __( `Move ${ accessibilityId } down` ) );
		await moveDownButton.click();
	}

	// position of the block to remove
	// Block will no longer be present if this succeeds
	async removeBlock( position: number ) {
		const blockLocator = `//*[starts-with(@${ this.accessibilityIdXPathAttrib }, block-${ position })]`;
		const blockElement = await this.driver.elementByXPath( blockLocator );
		const accessibilityId = blockElement.getAttribute( this.accessibilityIdKey );

		const removeButton = await this.driver.elementByAccessibilityId( __( `Remove ${ accessibilityId }` ) );
		await removeButton.click();
	}

	// =========================
	// Paragraph Block functions
	// =========================

	async addNewParagraphBlock() {
		await this.addNewBlock( 'Paragraph' );
	}

	async getParagraphBlockAtPosition( position: number ) {
		await this.driver.sleep( 2000 );
		const blockName = 'core/paragraph';
		return this.getBlockAtPosition( position, blockName );
	}

	async getTextViewForParagraphBlock( block: wd.PromiseChainWebdriver.Element ) {
		await this.driver.sleep( 2000 );
		let textViewElementName = 'XCUIElementTypeTextView';
		if ( isAndroid() ) {
			textViewElementName = 'android.widget.EditText';
		}

		const accessibilityId = await block.getAttribute( this.accessibilityIdKey );
		const blockLocator = `//*[@${ this.accessibilityIdXPathAttrib }="${ accessibilityId }"]//${ textViewElementName }`;
		return await this.driver.elementByXPath( blockLocator );
	}

	async sendTextToParagraphBlock( block: wd.PromiseChainWebdriver.Element, text: string ) {
		const textViewElement = this.getTextViewForParagraphBlock( block );
		return await typeString( textViewElement, text );
	}
}
