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
import { isAndroid, swipeUp, typeString, toggleHtmlMode } from '../helpers/utils';

export default class EditorPage {
	driver: wd.PromiseChainWebdriver;
	accessibilityIdKey: string;
	accessibilityIdXPathAttrib: string;
	paragraphBlockName = 'Paragraph';
	listBlockName = 'List';
	imageBlockName = 'Image';

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
	// and accessibilityId attributes on this object and selects the block
	// position uses one based numbering
	async getBlockAtPosition( position: number, blockName: string ) {
		const blockLocator = `//*[contains(@${ this.accessibilityIdXPathAttrib }, "${ blockName } Block. Row ${ position }.")]`;
		const elements = await this.driver.elementsByXPath( blockLocator );
		return elements[ elements.length - 1 ];
	}

	async hasBlockAtPosition( position: number, blockName: string = '' ) {
		return undefined !== await this.getBlockAtPosition( position, blockName );
	}

	async getTextViewForHtmlViewContent() {
		const accessibilityId = 'html-view-content';
		let blockLocator = `//*[@${ this.accessibilityIdXPathAttrib }="${ accessibilityId }"]`;

		if ( ! isAndroid() ) {
			blockLocator += '//XCUIElementTypeTextView';
		}
		return await this.driver.elementByXPath( blockLocator );
	}

	async getTitleElement() {
		//TODO: Improve the identifier for this element
		return isAndroid() ?
			await this.driver.elementByXPath( '//android.view.ViewGroup[@content-desc="Post title. Welcome to Gutenberg!"]/android.widget.EditText' ) :
			await this.driver.elementByXPath( '//XCUIElementTypeOther[@name="Add title"]/XCUIElementTypeTextView' );
	}

	// Converts to lower case and checks for a match to lowercased html content
	// Ensure to take additional steps to handle text being changed by auto correct
	async verifyHtmlContent( html: string ) {
		await toggleHtmlMode( this.driver, true );

		const htmlContentView = await this.getTextViewForHtmlViewContent();
		const text = await htmlContentView.text();
		expect( text.toLowerCase() ).toBe( html.toLowerCase() );

		await toggleHtmlMode( this.driver, false );
	}

	async dismissKeyboard() {
		if ( isAndroid() ) {
			return await this.driver.hideDeviceKeyboard();
		}
		const hideKeyboardToolbarButton = await this.driver.elementByXPath( '//XCUIElementTypeButton[@name="Hide keyboard"]' );
		await hideKeyboardToolbarButton.click();
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
		const addButton = await this.driver.elementByAccessibilityId( identifier );
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
		if ( ! await this.hasBlockAtPosition( position, blockName ) ) {
			throw Error( `No Block at position ${ position }` );
		}

		const parentLocator = `//*[@${ this.accessibilityIdXPathAttrib }="${ blockName } Block. Row ${ position }."]`;
		let blockLocator = `${ parentLocator }/following-sibling::*`;
		blockLocator += isAndroid() ? '' : '//*';
		blockLocator += `[@${ this.accessibilityIdXPathAttrib }="Move block up from row ${ position } to row ${ position - 1 }"]`;
		const moveUpButton = await this.driver.elementByXPath( blockLocator );
		await moveUpButton.click();
	}

	// position of the block to move down
	async moveBlockDownAtPosition( position: number, blockName: string = '' ) {
		if ( ! await this.hasBlockAtPosition( position, blockName ) ) {
			throw Error( `No Block at position ${ position }` );
		}

		const parentLocator = `//*[contains(@${ this.accessibilityIdXPathAttrib }, "${ blockName } Block. Row ${ position }.")]`;
		let blockLocator = `${ parentLocator }/following-sibling::*`;
		blockLocator += isAndroid() ? '' : '//*';
		blockLocator += `[@${ this.accessibilityIdXPathAttrib }="Move block down from row ${ position } to row ${ position + 1 }"]`;
		const moveDownButton = await this.driver.elementByXPath( blockLocator );
		await moveDownButton.click();
	}

	// position of the block to remove
	// Block will no longer be present if this succeeds
	async removeBlockAtPosition( position: number, blockName: string = '' ) {
		if ( ! await this.hasBlockAtPosition( position, blockName ) ) {
			throw Error( `No Block at position ${ position }` );
		}

		const parentLocator = `//*[contains(@${ this.accessibilityIdXPathAttrib }, "${ blockName } Block. Row ${ position }.")]`;
		let removeBlockLocator = `${ parentLocator }/following-sibling::*`;
		removeBlockLocator += isAndroid() ? '' : '//*';
		let removeButtonIdentifier = `Remove block at row ${ position }`;

		if ( isAndroid() ) {
			removeButtonIdentifier += ', Double tap to remove the block';
			const block = await this.getBlockAtPosition( position, blockName );
			let checkList = await this.driver.elementsByXPath( removeBlockLocator );
			while ( checkList.length === 0 ) {
				await swipeUp( this.driver, block ); // Swipe up to show remove icon at the bottom
				checkList = await this.driver.elementsByXPath( removeBlockLocator );
			}
		}

		removeBlockLocator += `[@${ this.accessibilityIdXPathAttrib }="${ removeButtonIdentifier }"]`;
		const removeButton = await this.driver.elementByXPath( removeBlockLocator );
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
		return this.hasBlockAtPosition( position, this.paragraphBlockName );
	}

	async getTextViewForParagraphBlock( block: wd.PromiseChainWebdriver.Element ) {
		let textViewElementName = 'XCUIElementTypeTextView';
		if ( isAndroid() ) {
			textViewElementName = 'android.widget.EditText';
		}

		const accessibilityId = await block.getAttribute( this.accessibilityIdKey );
		const blockLocator = `//*[@${ this.accessibilityIdXPathAttrib }=${ JSON.stringify( accessibilityId ) }]//${ textViewElementName }`;
		return await this.driver.elementByXPath( blockLocator );
	}

	async sendTextToParagraphBlock( block: wd.PromiseChainWebdriver.Element, text: string ) {
		const textViewElement = await this.getTextViewForParagraphBlock( block );
		await typeString( this.driver, textViewElement, text );
		await this.driver.sleep( 1000 ); // Give time for the block to rerender (such as for accessibility)
	}

	async sendTextToParagraphBlockAtPosition( position: number, text: string ) {
		const paragraphs = text.split( '\n' );
		for ( let i = 0; i < paragraphs.length; i++ ) {
			// Select block first
			const block = await this.getParagraphBlockAtPosition( position + i );
			await block.click();

			await this.sendTextToParagraphBlock( block, paragraphs[ i ] );
			if ( i !== paragraphs.length - 1 ) {
				await this.sendTextToParagraphBlock( block, '\n' );
			}
		}
	}

	async getTextForParagraphBlock( block: wd.PromiseChainWebdriver.Element ) {
		const textViewElement = await this.getTextViewForParagraphBlock( block );
		const text = await textViewElement.text();
		return text.toString();
	}

	async removeParagraphBlockAtPosition( position: number ) {
		await this.removeBlockAtPosition( position, this.paragraphBlockName );
	}

	async getTextForParagraphBlockAtPosition( position: number ) {
		// Select block first
		let block = await this.getParagraphBlockAtPosition( position );
		await block.click();

		block = await this.getParagraphBlockAtPosition( position );
		const text = await this.getTextForParagraphBlock( block );
		return text.toString();
	}

	// =========================
	// List Block functions
	// =========================

	async addNewListBlock() {
		await this.addNewBlock( this.listBlockName );
	}

	async getListBlockAtPosition( position: number ) {
		return this.getBlockAtPosition( position, this.listBlockName );
	}

	async hasListBlockAtPosition( position: number ) {
		return await this.hasBlockAtPosition( position, this.listBlockName );
	}

	async getTextViewForListBlock( block: wd.PromiseChainWebdriver.Element ) {
		let textViewElementName = 'XCUIElementTypeTextView';
		if ( isAndroid() ) {
			textViewElementName = 'android.widget.EditText';
		}

		const accessibilityId = await block.getAttribute( this.accessibilityIdKey );
		const blockLocator = `//*[@${ this.accessibilityIdXPathAttrib }=${ JSON.stringify( accessibilityId ) }]//${ textViewElementName }`;
		return await this.driver.elementByXPath( blockLocator );
	}

	async sendTextToListBlock( block: wd.PromiseChainWebdriver.Element, text: string ) {
		const textViewElement = await this.getTextViewForListBlock( block );
		return await typeString( this.driver, textViewElement, text );
	}

	async getTextForListBlock( block: wd.PromiseChainWebdriver.Element ) {
		const textViewElement = await this.getTextViewForListBlock( block );
		const text = await textViewElement.text();
		return text.toString();
	}

	async removeListBlockAtPosition( position: number ) {
		return await this.removeBlockAtPosition( position, this.listBlockName );
	}

	async getTextForListBlockAtPosition( position: number ) {
		const block = await this.getListBlockAtPosition( position );
		const text = await this.getTextForListBlock( block );
		return text.toString();
	}

	// =========================
	// Image Block functions
	// =========================

	async addNewImageBlock() {
		await this.addNewBlock( this.imageBlockName );
	}

	async getImageBlockAtPosition( position: number ) {
		return this.getBlockAtPosition( position, this.imageBlockName );
	}

	async selectEmptyImageBlock( block: wd.PromiseChainWebdriver.Element ) {
		const accessibilityId = await block.getAttribute( this.accessibilityIdKey );
		const blockLocator = `//*[@${ this.accessibilityIdXPathAttrib }="${ accessibilityId }"]//XCUIElementTypeButton[@name="Image block. Empty"]`;
		const imageBlockInnerElement = await this.driver.elementByXPath( blockLocator );
		await imageBlockInnerElement.click();
	}

	async chooseMediaLibrary() {
		const mediaLibraryButton = await this.driver.elementByAccessibilityId( 'WordPress Media Library' );
		await mediaLibraryButton.click();
	}

	async enterCaptionToSelectedImageBlock( caption: string ) {
		const imageBlockCaptionField = await this.driver.elementByXPath( '//XCUIElementTypeButton[@name="Image caption. Empty"]' );
		await imageBlockCaptionField.click();
		await typeString( this.driver, imageBlockCaptionField, caption );
	}

	async removeImageBlockAtPosition( position: number ) {
		return await this.removeBlockAtPosition( position, this.imageBlockName );
	}
}
