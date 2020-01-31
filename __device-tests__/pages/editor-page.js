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
import { isAndroid, swipeUp, swipeDown, typeString, toggleHtmlMode } from '../helpers/utils';

export default class EditorPage {
	driver: wd.PromiseChainWebdriver;
	accessibilityIdKey: string;
	accessibilityIdXPathAttrib: string;
	paragraphBlockName = 'Paragraph';
	listBlockName = 'List';
	headingBlockName = 'Heading';
	imageBlockName = 'Image';
	galleryBlockName = 'Gallery';

	constructor( driver: wd.PromiseChainWebdriver ) {
		this.driver = driver;
		this.accessibilityIdKey = 'name';
		this.accessibilityIdXPathAttrib = 'name';

		if ( isAndroid() ) {
			this.accessibilityIdXPathAttrib = 'content-desc';
			this.accessibilityIdKey = 'contentDescription';
		}

		driver.setImplicitWaitTimeout( 5000 );
	}

	async getBlockList() {
		return await this.driver.hasElementByAccessibilityId( 'block-list' );
	}

	// Finds the wd element for new block that was added and sets the element attribute
	// and accessibilityId attributes on this object and selects the block
	// position uses one based numbering
	async getBlockAtPosition( position: number, blockName: string, options: { autoscroll: boolean } = { autoscroll: false } ) {
		const blockLocator = `//*[contains(@${ this.accessibilityIdXPathAttrib }, "${ blockName } Block. Row ${ position }")]`;
		const elements = await this.driver.elementsByXPath( blockLocator );
		const lastElementFound = elements[ elements.length - 1 ];
		if ( elements.length === 0 && options.autoscroll ) {
			const firstBlockVisible = await this.getFirstBlockVisible();
			const lastBlockVisible = await this.getLastBlockVisible();
			// exit if no block is found
			if ( ! firstBlockVisible || ! lastBlockVisible ) {
				return lastElementFound;
			}
			const firstBlockAccessibilityId = await firstBlockVisible.getAttribute( this.accessibilityIdKey );
			const firstBlockRowMatch = /Row (\d+)\./.exec( firstBlockAccessibilityId );
			const firstBlockRow = firstBlockRowMatch && Number( firstBlockRowMatch[ 1 ] );
			const lastBlockAccessibilityId = await lastBlockVisible.getAttribute( this.accessibilityIdKey );
			const lastBlockRowMatch = /Row (\d+)\./.exec( lastBlockAccessibilityId );
			const lastBlockRow = lastBlockRowMatch && Number( lastBlockRowMatch[ 1 ] );
			if ( firstBlockRow && position < firstBlockRow ) {
				if ( firstBlockRow === 1 ) { // we're at the top already stop recursing
					return lastElementFound;
				}
				// scroll up
				await swipeDown( this.driver );
			} else if ( lastBlockRow && position > lastBlockRow ) {
				// scroll down
				await swipeUp( this.driver );
			}
			return this.getBlockAtPosition( position, blockName, options );
		}
		return lastElementFound;
	}

	async getFirstBlockVisible() {
		const firstBlockLocator = `//*[contains(@${ this.accessibilityIdXPathAttrib }, " Block. Row ")]`;
		const elements = await this.driver.elementsByXPath( firstBlockLocator );
		return elements[ 0 ];
	}

	async getLastBlockVisible() {
		const firstBlockLocator = `//*[contains(@${ this.accessibilityIdXPathAttrib }, " Block. Row ")]`;
		const elements = await this.driver.elementsByXPath( firstBlockLocator );
		return elements[ elements.length - 1 ];
	}

	async hasBlockAtPosition( position: number, blockName: string = '' ) {
		return undefined !== await this.getBlockAtPosition( position, blockName );
	}

	async getTitleElement( options: { autoscroll: boolean } = { autoscroll: false } ) {
		//TODO: Improve the identifier for this element
		const elements = await this.driver.elementsByXPath( `//*[contains(@${ this.accessibilityIdXPathAttrib }, "Post title.")]` );
		if ( elements.length === 0 && options.autoscroll ) {
			await swipeDown( this.driver );
			return this.getTitleElement( options );
		}
		return elements[ elements.length - 1 ];
	}

	async getTextViewForHtmlViewContent() {
		const accessibilityId = 'html-view-content';
		let blockLocator = `//*[@${ this.accessibilityIdXPathAttrib }="${ accessibilityId }"]`;

		if ( ! isAndroid() ) {
			blockLocator += '//XCUIElementTypeTextView';
		}
		return await this.driver.elementByXPath( blockLocator );
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

	// set html editor content explicitly
	async setHtmlContentAndroid( html: string ) {
		await toggleHtmlMode( this.driver, true );

		const htmlContentView = await this.getTextViewForHtmlViewContent();
		await htmlContentView.setText( html );

		await toggleHtmlMode( this.driver, false );
	}

	async dismissKeyboard() {
		await this.driver.sleep( 1000 ); /// wait for any keyboard animations
		const keyboardShown = await this.driver.isKeyboardShown();
		if ( ! keyboardShown ) {
			return;
		}
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

		const buttonElementName = isAndroid() ? '//*' : '//XCUIElementTypeButton';
		const removeButtonIdentifier = `Remove block at row ${ position }`;
		const removeBlockLocator = `${ buttonElementName }[contains(@${ this.accessibilityIdXPathAttrib }, "${ removeButtonIdentifier }")]`;

		if ( isAndroid() ) {
			const block = await this.getBlockAtPosition( position, blockName );
			let checkList = await this.driver.elementsByXPath( removeBlockLocator );
			while ( checkList.length === 0 ) {
				await swipeUp( this.driver, block ); // Swipe up to show remove icon at the bottom
				checkList = await this.driver.elementsByXPath( removeBlockLocator );
			}
		}

		const removeButton = await this.driver.elementByXPath( removeBlockLocator );
		await removeButton.click();
	}

	// =========================
	// Paragraph Block functions
	// =========================

	async addNewParagraphBlock() {
		await this.addNewBlock( this.paragraphBlockName );
	}

	async getParagraphBlockAtPosition( position: number, options: { autoscroll: boolean } = { autoscroll: false } ) {
		return this.getBlockAtPosition( position, this.paragraphBlockName, options );
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

	async sendTextToParagraphBlock( block: wd.PromiseChainWebdriver.Element, text: string, clear: boolean = true ) {
		const textViewElement = await this.getTextViewForParagraphBlock( block );
		await typeString( this.driver, textViewElement, text, clear );
		await this.driver.sleep( 1000 ); // Give time for the block to rerender (such as for accessibility)
	}

	async sendTextToParagraphBlockAtPosition( position: number, text: string, clear: boolean = true ) {
		const paragraphs = text.split( '\n' );
		for ( let i = 0; i < paragraphs.length; i++ ) {
			// Select block first
			const block = await this.getParagraphBlockAtPosition( position + i );
			await block.click();

			await this.sendTextToParagraphBlock( block, paragraphs[ i ], clear );
			if ( i !== paragraphs.length - 1 ) {
				await this.sendTextToParagraphBlock( block, '\n', false );
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

		// Cannot clear list blocks because it messes up the list bullet
		const clear = false;

		return await typeString( this.driver, textViewElement, text, clear );
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

	async enterCaptionToSelectedImageBlock( caption: string, clear: boolean = true ) {
		const imageBlockCaptionField = await this.driver.elementByXPath( '//XCUIElementTypeButton[@name="Image caption. Empty"]' );
		await imageBlockCaptionField.click();
		await typeString( this.driver, imageBlockCaptionField, caption, clear );
	}

	async removeImageBlockAtPosition( position: number ) {
		return await this.removeBlockAtPosition( position, this.imageBlockName );
	}

	// =========================
	// Gallery Block functions
	// =========================

	async addNewGalleryBlock() {
		await this.addNewBlock( this.galleryBlockName );
	}

	async getGalleryBlockAtPosition( position: number ) {
		return this.getBlockAtPosition( position, this.galleryBlockName );
	}

	async removeGalleryBlockAtPosition( position: number ) {
		return await this.removeBlockAtPosition( position, this.galleryBlockName );
	}

	// =========================
	// Heading Block functions
	// =========================
	async addNewHeadingBlock() {
		await this.addNewBlock( this.headingBlockName );
	}

	async getHeadingBlockAtPosition( position: number ) {
		return this.getBlockAtPosition( position, this.headingBlockName );
	}

	// Inner element changes on iOS if Heading Block is empty
	async getTextViewForHeadingBlock( block: wd.PromiseChainWebdriver.Element, empty: boolean ) {
		let textViewElementName = empty ? 'XCUIElementTypeStaticText' : 'XCUIElementTypeTextView';
		if ( isAndroid() ) {
			textViewElementName = 'android.widget.EditText';
		}

		const accessibilityId = await block.getAttribute( this.accessibilityIdKey );
		const blockLocator = `//*[@${ this.accessibilityIdXPathAttrib }="${ accessibilityId }"]//${ textViewElementName }`;
		return await this.driver.elementByXPath( blockLocator );
	}

	async sendTextToHeadingBlock( block: wd.PromiseChainWebdriver.Element, text: string, clear: boolean = true ) {
		const textViewElement = await this.getTextViewForHeadingBlock( block, true );
		return await typeString( this.driver, textViewElement, text, clear );
	}

	async getTextForHeadingBlock( block: wd.PromiseChainWebdriver.Element ) {
		const textViewElement = await this.getTextViewForHeadingBlock( block, false );
		const text = await textViewElement.text();
		return text.toString();
	}
}
