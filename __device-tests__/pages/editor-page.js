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
	accessibilityIdKey: string;
	accessibilityIdXPathAttrib: string;

	constructor( driver: wd.PromiseChainWebdriver ) {
		this.driver = driver;
		this.accessibilityIdKey = 'name';
		this.accessibilityIdXPathAttrib = 'name';

		if ( isAndroid() ) {
			this.accessibilityIdXPathAttrib = 'content-desc';
			this.accessibilityIdKey = 'contentDescription';
		}
	}

	async getBlockList() {
		return this.driver.hasElementByAccessibilityId( 'block-list' );
	}

	async addNewBlock( blockName: string ) {
		// Click add button
		let identifier = 'Add block';
		if ( isAndroid() ) {
			identifier = 'Add block, Double tap to add a block';
		}
		const addButton = await this.driver.elementByAccessibilityId( __( identifier ) );
		await addButton.click();

		// Click on block of choice
		const blockButton = await this.driver.elementByAccessibilityId( blockName );
		await blockButton.click();
	}

	// Finds the wd element for new block that was added and sets the element attribute
	// and accessibilityId attributes on this object
	async getBlockAtPosition( position: number, blockName: string ) {
		const blockLocator = `block-${ position }-${ blockName }`;
		return await this.driver.elementByAccessibilityId( blockLocator );
	}

	async hasBlockAtPosition( position: number, blockName: string = '' ) {
		if ( blockName !== '' ) {
			const blockLocator = `block-${ position }-${ blockName }`;
			const elements = await this.driver.elementsByAccessibilityId( blockLocator );
			return elements.length > 0;
		}
		const blockLocator = `//*[starts-with(@${ this.accessibilityIdXPathAttrib }, "block-${ position }")]`;
		const elements = await this.driver.elementsByXPath( blockLocator );
		return elements.length > 0;
	}

	// position of the block to move up
	async moveBlockUpAtPosition( position: number ) {
		const blockLocator = `//*[starts-with(@${ this.accessibilityIdXPathAttrib }, "block-${ position }")]`;
		const blockElement = await this.driver.elementByXPath( blockLocator );
		const accessibilityId = blockElement.getAttribute( this.accessibilityIdKey );

		const moveUpButton = await this.driver.elementByAccessibilityId( __( `Move ${ accessibilityId } up` ) );
		await moveUpButton.click();
	}

	// position of the block to move down
	async moveBlockDownAtPosition( position: number ) {
		const blockLocator = `//*[starts-with(@${ this.accessibilityIdXPathAttrib }, "block-${ position }"]`;
		const blockElement = await this.driver.elementByXPath( blockLocator );
		const accessibilityId = blockElement.getAttribute( this.accessibilityIdKey );

		const moveDownButton = await this.driver.elementByAccessibilityId( __( `Move ${ accessibilityId } down` ) );
		await moveDownButton.click();
	}

	// position of the block to remove
	// Block will no longer be present if this succeeds
	async removeBlockAtPosition( position: number ) {
		const blockLocator = `//*[starts-with(@${ this.accessibilityIdXPathAttrib }, "block-${ position }")]`;
		const blockElement = await this.driver.elementByXPath( blockLocator );
		const accessibilityId = await blockElement.getAttribute( this.accessibilityIdKey );

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
		const blockName = 'core/paragraph';
		return this.getBlockAtPosition( position, blockName );
	}

	async hasParagraphBlockAtPosition( position: number ) {
		const blockName = 'core/paragraph';
		return await this.hasBlockAtPosition( position, blockName );
	}

	async getTextViewForParagraphBlock( block: wd.PromiseChainWebdriver.Element ) {
		let textViewElementName = 'XCUIElementTypeTextView';
		if ( isAndroid() ) {
			textViewElementName = 'android.widget.EditText';
		}

		const accessibilityId = await block.getAttribute( this.accessibilityIdKey );
		const blockLocator = `//*[@${ this.accessibilityIdXPathAttrib }="${ accessibilityId }"]//${ textViewElementName }`;
		return await this.driver.elementByXPath( blockLocator );
	}

	async sendTextToParagraphBlock( block: wd.PromiseChainWebdriver.Element, text: string ) {
		const textViewElement = await this.getTextViewForParagraphBlock( block );
		await typeString( textViewElement, text );
	}

	async getTextForParagraphBlock( block: wd.PromiseChainWebdriver.Element ) {
		const textViewElement = await this.getTextViewForParagraphBlock( block );
		const text = await textViewElement.text();
		return text.toString();
	}

	async getTextForParagraphBlockAtPosition( position: number ) {
		const block = await this.getParagraphBlockAtPosition( position );
		const text = await this.getTextForParagraphBlock( block );
		return text.toString();
	}
}
