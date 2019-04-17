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
import { isAndroid, swipeUp, typeString } from '../helpers/utils';

export default class EditorPage {
	driver: wd.PromiseChainWebdriver;
	accessibilityIdKey: string;
	accessibilityIdXPathAttrib: string;
	paragraphBlockName = 'Paragraph';

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

	// Finds the wd element for new block that was added and sets the element attribute
	// and accessibilityId attributes on this object
	// position uses one based numbering
	async getBlockAtPosition( position: number, blockName: string ) {
		const blockLocator = `${ blockName } Block. Row ${ position }.`;
		return await this.driver.elementByAccessibilityId( blockLocator );
	}

	async hasBlockAtPosition( position: number, blockName: string = '' ) {
		if ( blockName !== '' ) {
			const blockLocator = `${ blockName } Block. Row ${ position }.`;
			const elements = await this.driver.elementsByAccessibilityId( blockLocator );
			return elements.length > 0;
		}
		const blockLocator = `//*[contains(@${ this.accessibilityIdXPathAttrib }, "Block. Row ${ position }.")]`;
		const elements = await this.driver.elementsByXPath( blockLocator );
		return elements.length > 0;
	}

	// =========================
	// Block toolbar functions
	// =========================

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

	// =========================
	// Inline toolbar functions
	// =========================

	// position of the block to move up
	async moveBlockUpAtPosition( position: number, blockName: string = '' ) {
		if ( ! this.hasBlockAtPosition( position, blockName ) ) {
			throw `No Block at position ${ position }`;
		}

		let parentLocator = `//*[contains(@${ this.accessibilityIdXPathAttrib }, "Block. Row ${ position }.")]`;
		if ( blockName !== '' ) {
			parentLocator = `//*[@${ this.accessibilityIdXPathAttrib }="${ blockName } Block. Row ${ position }."]`;
		}

		let blockLocator = `${ parentLocator }/following-sibling::*`;
		blockLocator += isAndroid() ? '' : '//*';
		blockLocator += `[@${ this.accessibilityIdXPathAttrib }="Move up from row ${ position } to row ${ position - 1 }"]`;
		const moveUpButton = await this.driver.elementByXPath( blockLocator );
		await moveUpButton.click();
	}

	// position of the block to move down
	async moveBlockDownAtPosition( position: number, blockName: string = '' ) {
		if ( ! this.hasBlockAtPosition( position, blockName ) ) {
			throw `No Block at position ${ position }`;
		}

		let parentLocator = `//*[contains(@${ this.accessibilityIdXPathAttrib }, "Block. Row ${ position }.")]`;
		if ( blockName !== '' ) {
			parentLocator = `//*[@${ this.accessibilityIdXPathAttrib }="${ blockName } Block. Row ${ position }."]`;
		}

		let blockLocator = `${ parentLocator }/following-sibling::*`;
		blockLocator += isAndroid() ? '' : '//*';
		blockLocator += `[@${ this.accessibilityIdXPathAttrib }="Move down from row ${ position } to row ${ position + 1 }"]`;
		const moveDownButton = await this.driver.elementByXPath( blockLocator );
		await moveDownButton.click();
	}

	// position of the block to remove
	// Block will no longer be present if this succeeds
	async removeBlockAtPosition( position: number, blockName: string = '' ) {
		if ( ! this.hasBlockAtPosition( position, blockName ) ) {
			throw `No Block at position ${ position }`;
		}

		let parentLocator = `//*[contains(@${ this.accessibilityIdXPathAttrib }, "Block. Row ${ position }.")]`;
		if ( blockName !== '' ) {
			parentLocator = `//*[@${ this.accessibilityIdXPathAttrib }="${ blockName } Block. Row ${ position }."]`;
		}

		let blockLocator = `${ parentLocator }/following-sibling::*`;
		blockLocator += isAndroid() ? '' : '//*';
		blockLocator += `[@${ this.accessibilityIdXPathAttrib }="Remove row ${ position }"]`;
		if ( isAndroid() ) {
			const block = await this.getBlockAtPosition( position, blockName );
			let checkList = await this.driver.elementsByXPath( blockLocator );
			while ( checkList.length === 0 ) {
				await swipeUp( this.driver, block ); // Swipe up to show remove icon at the bottom
				checkList = await this.driver.elementsByXPath( blockLocator );
			}
		}

		const removeButton = await this.driver.elementByXPath( blockLocator );
		await removeButton.click();
	}

	// =========================
	// Paragraph Block functions
	// =========================

	async addNewParagraphBlock() {
		await this.addNewBlock( this.paragraphBlockName );
	}

	async getParagraphBlockAtPosition( position: number ) {
		return this.getBlockAtPosition( position, this.paragraphBlockName );
	}

	async hasParagraphBlockAtPosition( position: number ) {
		return await this.hasBlockAtPosition( position, this.paragraphBlockName );
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
		return await typeString( this.driver, textViewElement, text );
	}

	async getTextForParagraphBlock( block: wd.PromiseChainWebdriver.Element ) {
		const textViewElement = await this.getTextViewForParagraphBlock( block );
		const text = await textViewElement.text();
		return text.toString();
	}

	async removeParagraphBlockAtPosition( position: number ) {
		return await this.removeBlockAtPosition( position, this.paragraphBlockName );
	}

	async getTextForParagraphBlockAtPosition( position: number ) {
		const block = await this.getParagraphBlockAtPosition( position );
		const text = await this.getTextForParagraphBlock( block );
		return text.toString();
	}
}
