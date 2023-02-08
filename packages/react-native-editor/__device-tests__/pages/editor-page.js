/**
 * Internal dependencies
 */
const {
	doubleTap,
	isAndroid,
	isEditorVisible,
	isElementVisible,
	longPressMiddleOfElement,
	setClipboard,
	setupDriver,
	stopDriver,
	swipeDown,
	swipeFromTo,
	swipeUp,
	tapPasteAboveElement,
	toggleHtmlMode,
	typeString,
	waitForVisible,
	clickIfClickable,
} = require( '../helpers/utils' );

const initializeEditorPage = async () => {
	const driver = await setupDriver();
	await isEditorVisible( driver );
	return new EditorPage( driver );
};

class EditorPage {
	driver;
	accessibilityIdKey;
	accessibilityIdXPathAttrib;
	paragraphBlockName = 'Paragraph';
	verseBlockName = 'Verse';
	orderedListButtonName = 'Ordered';

	constructor( driver ) {
		this.driver = driver;
		this.accessibilityIdKey = 'name';
		this.accessibilityIdXPathAttrib = 'name';

		if ( isAndroid() ) {
			this.accessibilityIdXPathAttrib = 'content-desc';
			this.accessibilityIdKey = 'contentDescription';
		}
	}

	async getBlockList() {
		return await this.driver.hasElementByAccessibilityId( 'block-list' );
	}

	// ===============================
	// Text blocks functions
	// E.g. Paragraph, Heading blocks
	// ===============================
	async getTextBlockAtPosition( blockName, position = 1 ) {
		// iOS needs a click to get the text element
		if ( ! isAndroid() ) {
			const textBlockLocator = `(//XCUIElementTypeButton[contains(@name, "${ blockName } Block. Row ${ position }")])`;

			await clickIfClickable( this.driver, textBlockLocator );
		}

		const blockLocator = isAndroid()
			? `//android.view.ViewGroup[contains(@content-desc, "${ blockName } Block. Row ${ position }.")]//android.widget.EditText`
			: `//XCUIElementTypeButton[contains(@name, "${ blockName } Block. Row ${ position }.")]//XCUIElementTypeTextView`;

		return await waitForVisible( this.driver, blockLocator );
	}

	async typeTextToTextBlock( block, text, clear ) {
		await typeString( this.driver, block, text, clear );
	}

	// Finds the wd element for new block that was added and sets the element attribute
	// and accessibilityId attributes on this object and selects the block
	// position uses one based numbering.
	async getBlockAtPosition(
		blockName,
		position = 1,
		options = { autoscroll: false }
	) {
		let elementType;
		switch ( blockName ) {
			case blockNames.cover:
				elementType = 'XCUIElementTypeButton';
				break;
			default:
				elementType = 'XCUIElementTypeOther';
				break;
		}

		const blockLocator = isAndroid()
			? `//android.view.ViewGroup[contains(@${ this.accessibilityIdXPathAttrib }, "${ blockName } Block. Row ${ position }")]`
			: `(//${ elementType }[contains(@${ this.accessibilityIdXPathAttrib }, "${ blockName } Block. Row ${ position }")])[1]`;

		await waitForVisible( this.driver, blockLocator );

		const elements = await this.driver.elementsByXPath( blockLocator );
		const lastElementFound = elements[ elements.length - 1 ];
		if ( elements.length === 0 && options.autoscroll ) {
			const firstBlockVisible = await this.getFirstBlockVisible();
			const lastBlockVisible = await this.getLastBlockVisible();
			// Exit if no block is found.
			if ( ! firstBlockVisible || ! lastBlockVisible ) {
				return lastElementFound;
			}
			const firstBlockAccessibilityId =
				await firstBlockVisible.getAttribute( this.accessibilityIdKey );
			const firstBlockRowMatch = /Row (\d+)\./.exec(
				firstBlockAccessibilityId
			);
			const firstBlockRow =
				firstBlockRowMatch && Number( firstBlockRowMatch[ 1 ] );
			const lastBlockAccessibilityId =
				await lastBlockVisible.getAttribute( this.accessibilityIdKey );
			const lastBlockRowMatch = /Row (\d+)\./.exec(
				lastBlockAccessibilityId
			);
			const lastBlockRow =
				lastBlockRowMatch && Number( lastBlockRowMatch[ 1 ] );
			if ( firstBlockRow && position < firstBlockRow ) {
				if ( firstBlockRow === 1 ) {
					// We're at the top already stop recursing.
					return lastElementFound;
				}
				// Scroll up.
				await swipeDown( this.driver );
			} else if ( lastBlockRow && position > lastBlockRow ) {
				// Scroll down.
				await swipeUp( this.driver );
			}
			return await this.getBlockAtPosition(
				blockName,
				position,
				options
			);
		}
		return lastElementFound;
	}

	async getFirstBlockVisible() {
		const firstBlockLocator = `//*[contains(@${ this.accessibilityIdXPathAttrib }, " Block. Row ")]`;
		return await waitForVisible( this.driver, firstBlockLocator );
	}

	async getLastBlockVisible() {
		const firstBlockLocator = `//*[contains(@${ this.accessibilityIdXPathAttrib }, " Block. Row ")]`;
		return await waitForVisible(
			this.driver,
			firstBlockLocator,
			25,
			'lastElement'
		);
	}

	async hasBlockAtPosition( position = 1, blockName = '' ) {
		return (
			undefined !==
			( await this.getBlockAtPosition( blockName, position ) )
		);
	}

	async addParagraphBlockByTappingEmptyAreaBelowLastBlock() {
		const emptyAreaBelowLastBlock =
			await this.driver.elementByAccessibilityId( 'Add paragraph block' );
		await emptyAreaBelowLastBlock.click();
	}

	async getTitleElement( options = { autoscroll: false } ) {
		// TODO: Improve the identifier for this element
		const elements = await this.driver.elementsByXPath(
			`//*[contains(@${ this.accessibilityIdXPathAttrib }, "Post title.")]`
		);
		if ( elements.length === 0 && options.autoscroll ) {
			await swipeDown( this.driver );
			return this.getTitleElement( options );
		}
		return elements[ elements.length - 1 ];
	}

	// iOS loads the block list more eagerly compared to Android.
	// This makes this function return elements without scrolling on iOS.
	// So we are keeping this Android only.
	async androidScrollAndReturnElement( accessibilityLabel ) {
		const elements = await this.driver.elementsByXPath(
			`//*[contains(@${ this.accessibilityIdXPathAttrib }, "${ accessibilityLabel }")]`
		);
		if ( elements.length === 0 ) {
			await swipeUp( this.driver, undefined, 100, 1 );
			return this.androidScrollAndReturnElement( accessibilityLabel );
		}
		return elements[ elements.length - 1 ];
	}

	// For iOS, depending on the content and how fast the block list
	// renders blocks, it won't need to scroll down as it would find
	// the block right away.
	async scrollAndReturnElementByAccessibilityId( id ) {
		const elements = await this.driver.elementsByAccessibilityId( id );

		if ( elements.length === 0 ) {
			await swipeUp( this.driver, undefined, 100, 1 );
			return this.scrollAndReturnElementByAccessibilityId( id );
		}
		return elements[ elements.length - 1 ];
	}

	async getLastElementByXPath( accessibilityLabel ) {
		const elements = await this.driver.elementsByXPath(
			`//*[contains(@${ this.accessibilityIdXPathAttrib }, "${ accessibilityLabel }")]`
		);
		return elements[ elements.length - 1 ];
	}

	async getTextViewForHtmlViewContent() {
		const accessibilityId = 'html-view-content';
		const htmlViewLocator = isAndroid()
			? `//*[@${ this.accessibilityIdXPathAttrib }="${ accessibilityId }"]`
			: `//XCUIElementTypeTextView[starts-with(@${ this.accessibilityIdXPathAttrib }, "${ accessibilityId }")]`;

		return await waitForVisible( this.driver, htmlViewLocator );
	}

	// Returns html content
	// Ensure to take additional steps to handle text being changed by auto correct.
	async getHtmlContent() {
		await toggleHtmlMode( this.driver, true );

		const htmlContentView = await this.getTextViewForHtmlViewContent();
		const text = await htmlContentView.text();

		await toggleHtmlMode( this.driver, false );
		return text;
	}

	// Set html editor content explicitly.
	async setHtmlContent( html ) {
		await toggleHtmlMode( this.driver, true );

		await setClipboard( this.driver, html );

		const htmlContentView = await this.getTextViewForHtmlViewContent();

		await htmlContentView.click();
		await doubleTap( this.driver, htmlContentView );
		await tapPasteAboveElement( this.driver, htmlContentView );

		await toggleHtmlMode( this.driver, false );
	}

	async dismissKeyboard() {
		const keyboardShown = await this.driver.isKeyboardShown();
		if ( ! keyboardShown ) {
			return;
		}
		if ( isAndroid() ) {
			return await this.driver.hideDeviceKeyboard();
		}

		await clickIfClickable(
			this.driver,
			'//XCUIElementTypeButton[@name="Hide keyboard"]'
		);
	}

	async dismissAndroidClipboardSmartSuggestion() {
		if ( ! isAndroid() ) {
			return;
		}

		const dismissClipboardSmartSuggestionLocator = `//*[@${ this.accessibilityIdXPathAttrib }="Dismiss Smart Suggestion"]`;
		const smartSuggestions = await this.driver.elementsByXPath(
			dismissClipboardSmartSuggestionLocator
		);
		if ( smartSuggestions.length !== 0 ) {
			smartSuggestions[ 0 ].click();
		}
	}

	async openBlockSettings( block ) {
		await block.click();

		const settingsButton = await block.elementByAccessibilityId(
			'Open Settings'
		);
		await settingsButton.click();
	}

	async dismissBottomSheet() {
		return await swipeDown( this.driver );
	}

	// =========================
	// Block toolbar functions
	// =========================

	async addNewBlock( blockName, relativePosition ) {
		const addBlockButtonLocator = isAndroid()
			? '//android.widget.Button[@content-desc="Add block, Double tap to add a block"]'
			: '//XCUIElementTypeButton[@name="add-block-button"]';

		const addButton = await waitForVisible(
			this.driver,
			addBlockButtonLocator
		);

		if ( relativePosition === 'before' ) {
			// On Android it doesn't get the right size of the button
			const customElementSize = {
				width: 43,
				height: 43,
			};

			await longPressMiddleOfElement(
				this.driver,
				addButton,
				8000,
				customElementSize
			);
			const addBlockBeforeButtonLocator = isAndroid()
				? '//android.widget.Button[@content-desc="Add Block Before"]'
				: '//XCUIElementTypeButton[@name="Add Block Before"]';

			await clickIfClickable( this.driver, addBlockBeforeButtonLocator );
		} else {
			await addButton.click();
		}

		// Click on block of choice.
		const blockButton = await this.findBlockButton( blockName );

		if ( isAndroid() ) {
			await blockButton.click();
		} else {
			await this.driver.execute( 'mobile: tap', {
				element: blockButton,
				x: 10,
				y: 10,
			} );
		}
	}

	static getInserterPageHeight( screenHeight ) {
		// Rough estimate of a swipe distance required to scroll one page of blocks.
		return screenHeight * 0.82;
	}

	// Attempts to find the given block button in the block inserter control.
	async findBlockButton( blockName ) {
		// Wait for the first block, Paragraph block, to load before looking for other blocks
		const paragraphBlockLocator = isAndroid()
			? '//android.widget.Button[@content-desc="Paragraph block"]/android.widget.TextView'
			: '//XCUIElementTypeButton[@name="Paragraph block"]';

		await waitForVisible( this.driver, paragraphBlockLocator );
		const blockAccessibilityLabel = `${ blockName } block`;
		const blockAccessibilityLabelNewBlock = `${ blockAccessibilityLabel }, newly available`;

		if ( isAndroid() ) {
			const size = await this.driver.getWindowSize();
			const x = size.width / 2;
			// Checks if the Block Button is available, and if not will scroll to the second half of the available buttons.
			while (
				! ( await this.driver.hasElementByAccessibilityId(
					blockAccessibilityLabel
				) ) &&
				! ( await this.driver.hasElementByAccessibilityId(
					blockAccessibilityLabelNewBlock
				) )
			) {
				swipeFromTo(
					this.driver,
					{ x, y: size.height - 100 },
					{ x, y: EditorPage.getInserterPageHeight( size.height ) }
				);
			}

			if (
				await this.driver.hasElementByAccessibilityId(
					blockAccessibilityLabelNewBlock
				)
			) {
				return await this.driver.elementByAccessibilityId(
					blockAccessibilityLabelNewBlock
				);
			}

			return await this.driver.elementByAccessibilityId(
				blockAccessibilityLabel
			);
		}

		const blockButton = ( await this.driver.hasElementByAccessibilityId(
			blockAccessibilityLabelNewBlock
		) )
			? await this.driver.elementByAccessibilityId(
					blockAccessibilityLabelNewBlock
			  )
			: await this.driver.elementByAccessibilityId(
					blockAccessibilityLabel
			  );

		const size = await this.driver.getWindowSize();
		// The virtual home button covers the bottom 34 in portrait and 21 on landscape on iOS.
		// We start dragging a bit above it to not trigger home button.
		const height = size.height - 50;

		while ( ! ( await blockButton.isDisplayed() ) ) {
			await this.driver.execute( 'mobile: dragFromToForDuration', {
				fromX: 50,
				fromY: height,
				toX: 50,
				toY: EditorPage.getInserterPageHeight( height ),
				duration: 0.5,
			} );
		}

		return blockButton;
	}

	async clickToolBarButton( buttonName ) {
		const toolBarButton = await this.driver.elementByAccessibilityId(
			buttonName
		);
		await toolBarButton.click();
	}

	// =========================
	// Inline toolbar functions
	// =========================

	// position of the block to move up.
	async moveBlockUpAtPosition( position, blockName = '' ) {
		if ( ! ( await this.hasBlockAtPosition( position, blockName ) ) ) {
			throw Error( `No Block at position ${ position }` );
		}

		const parentLocator = `//*[@${ this.accessibilityIdXPathAttrib }="${ blockName } Block. Row ${ position }."]`;
		let blockLocator = `${ parentLocator }/following-sibling::*`;
		blockLocator += isAndroid() ? '' : '//*';
		blockLocator += `[@${
			this.accessibilityIdXPathAttrib
		}="Move block up from row ${ position } to row ${ position - 1 }"]`;
		const moveUpButton = await this.driver.elementByXPath( blockLocator );
		await moveUpButton.click();
	}

	// position of the block to move down.
	async moveBlockDownAtPosition( position, blockName = '' ) {
		if ( ! ( await this.hasBlockAtPosition( position, blockName ) ) ) {
			throw Error( `No Block at position ${ position }` );
		}

		const parentLocator = `//*[contains(@${ this.accessibilityIdXPathAttrib }, "${ blockName } Block. Row ${ position }.")]`;
		let blockLocator = `${ parentLocator }/following-sibling::*`;
		blockLocator += isAndroid() ? '' : '//*';
		blockLocator += `[@${
			this.accessibilityIdXPathAttrib
		}="Move block down from row ${ position } to row ${ position + 1 }"]`;
		const moveDownButton = await this.driver.elementByXPath( blockLocator );
		await moveDownButton.click();
	}

	// Position of the block to remove
	// Block will no longer be present if this succeeds.
	async removeBlockAtPosition( blockName = '', position = 1 ) {
		if ( ! ( await this.hasBlockAtPosition( position, blockName ) ) ) {
			throw Error( `No Block at position ${ position }` );
		}

		const buttonElementName = isAndroid()
			? '//*'
			: '//XCUIElementTypeButton';
		const blockActionsMenuButtonIdentifier = `Open Block Actions Menu`;
		const blockActionsMenuButtonLocator = `${ buttonElementName }[contains(@${ this.accessibilityIdXPathAttrib }, "${ blockActionsMenuButtonIdentifier }")]`;
		const blockActionsMenuButton = await waitForVisible(
			this.driver,
			blockActionsMenuButtonLocator
		);
		if ( isAndroid() ) {
			const block = await this.getBlockAtPosition( blockName, position );
			let checkList = await this.driver.elementsByXPath(
				blockActionsMenuButtonLocator
			);
			while ( checkList.length === 0 ) {
				await swipeUp( this.driver, block ); // Swipe up to show remove icon at the bottom.
				checkList = await this.driver.elementsByXPath(
					blockActionsMenuButtonLocator
				);
			}
		}

		await blockActionsMenuButton.click();
		const removeActionButtonIdentifier = 'Remove block';
		const removeActionButtonLocator = `${ buttonElementName }[contains(@${ this.accessibilityIdXPathAttrib }, "${ removeActionButtonIdentifier }")]`;
		const removeActionButton = await waitForVisible(
			this.driver,
			removeActionButtonLocator
		);

		await removeActionButton.click();
	}

	// =========================
	// Paragraph Block functions
	// =========================

	async getParagraphBlockWrapperAtPosition( position = 1 ) {
		// iOS needs a click to get the text element
		const blockLocator = isAndroid()
			? `//android.view.ViewGroup[contains(@content-desc, "Paragraph Block. Row ${ position }")]`
			: `(//XCUIElementTypeButton[contains(@name, "Paragraph Block. Row ${ position }")])`;

		return await waitForVisible( this.driver, blockLocator );
	}

	async sendTextToParagraphBlock( position, text, clear ) {
		const paragraphs = text.split( '\n' );
		for ( let i = 0; i < paragraphs.length; i++ ) {
			const block = await this.getTextBlockAtPosition(
				blockNames.paragraph,
				position + i
			);

			if ( isAndroid() ) {
				await block.click();
			}

			await this.typeTextToTextBlock( block, paragraphs[ i ], clear );
			if ( i !== paragraphs.length - 1 ) {
				await this.typeTextToTextBlock( block, '\n', false );
			}
		}
	}

	async getTextForParagraphBlockAtPosition( position ) {
		const blockLocator = await this.getTextBlockAtPosition(
			blockNames.paragraph,
			position
		);

		return await blockLocator.text();
	}

	async getNumberOfParagraphBlocks() {
		const paragraphBlockLocator = isAndroid()
			? `//android.view.ViewGroup[contains(@content-desc, "Paragraph Block. Row")]//android.widget.EditText`
			: `(//XCUIElementTypeButton[contains(@name, "Paragraph Block. Row")])`;

		const locator = await this.driver.elementsByXPath(
			paragraphBlockLocator
		);
		return locator.length;
	}

	async assertSlashInserterPresent() {
		const slashInserterLocator = isAndroid()
			? '//android.widget.HorizontalScrollView[@content-desc="Slash inserter results"]/android.view.ViewGroup'
			: '(//XCUIElementTypeOther[@name="Slash inserter results"])[1]';

		return await isElementVisible( this.driver, slashInserterLocator, 5 );
	}

	// =========================
	// List Block functions
	// =========================

	async getListBlockAtPosition(
		position = 1,
		options = { isEmptyBlock: false }
	) {
		// iOS needs a few extra steps to get the text element
		if ( ! isAndroid() ) {
			// Click the list in the correct position
			await clickIfClickable(
				this.driver,
				`(//XCUIElementTypeOther[contains(@name, "List Block. Row ${ position }")])[1]`
			);

			const listBlockLocator = options.isEmptyBlock
				? `(//XCUIElementTypeStaticText[contains(@name, "List")])`
				: `//XCUIElementTypeButton[contains(@name, "List")]`;

			await clickIfClickable( this.driver, listBlockLocator );
		}

		const listBlockTextLocatorIOS = options.isEmptyBlock
			? `(//XCUIElementTypeStaticText[contains(@name, "List")])`
			: `//XCUIElementTypeButton[contains(@name, "List")]//XCUIElementTypeTextView`;

		const listBlockTextLocator = isAndroid()
			? `//android.view.ViewGroup[contains(@content-desc, "List Block. Row ${ position }")]//android.widget.EditText`
			: listBlockTextLocatorIOS;

		return await waitForVisible( this.driver, listBlockTextLocator );
	}

	async clickOrderedListToolBarButton() {
		const toolBarLocator = isAndroid()
			? `//android.widget.Button[@content-desc="${ this.orderedListButtonName }"]`
			: `//XCUIElementTypeButton[@name="${ this.orderedListButtonName }"]`;

		await waitForVisible( this.driver, toolBarLocator );
		await this.clickToolBarButton( this.orderedListButtonName );
	}

	// =========================
	// Cover Block functions
	// For iOS only
	// =========================

	async clickAddMediaFromCoverBlock() {
		const mediaSection = await waitForVisible(
			this.driver,
			'//XCUIElementTypeOther[@name="Media Add image or video"]'
		);
		const addMediaButton = await mediaSection.elementByAccessibilityId(
			'Add image or video'
		);
		await addMediaButton.click();
	}

	async replaceMediaImage() {
		await clickIfClickable(
			this.driver,
			'(//XCUIElementTypeButton[@name="Edit image"])[1]'
		);
		await clickIfClickable(
			this.driver,
			'//XCUIElementTypeButton[@name="Replace"]'
		);
	}

	// =========================
	// Image Block functions
	// =========================

	async selectEmptyImageBlock( block ) {
		const accessibilityId = await block.getAttribute(
			this.accessibilityIdKey
		);
		const blockLocator = `//*[@${ this.accessibilityIdXPathAttrib }="${ accessibilityId }"]//XCUIElementTypeButton[@name="Image block. Empty"]`;
		const imageBlockInnerElement = await this.driver.elementByXPath(
			blockLocator
		);
		await imageBlockInnerElement.click();
	}

	async chooseMediaLibrary() {
		const mediaLibraryLocator = isAndroid()
			? `//android.widget.Button[@content-desc="WordPress Media Library"]`
			: `//XCUIElementTypeButton[@name="WordPress Media Library"]`;

		await clickIfClickable( this.driver, mediaLibraryLocator );
	}

	async enterCaptionToSelectedImageBlock( caption, clear = true ) {
		const imageBlockCaptionField = await this.driver.elementByXPath(
			'//XCUIElementTypeButton[starts-with(@name, "Image caption.")]'
		);
		await imageBlockCaptionField.click();
		await typeString( this.driver, imageBlockCaptionField, caption, clear );
	}

	async closePicker() {
		if ( isAndroid() ) {
			// Wait for media block picker to load before closing
			const locator =
				'//android.view.ViewGroup[2]/android.view.ViewGroup/android.view.ViewGroup';
			await waitForVisible( this.driver, locator );

			await swipeDown( this.driver );
		} else {
			await clickIfClickable(
				this.driver,
				'//XCUIElementTypeButton[@name="Cancel"]'
			);
		}
	}

	// =============================
	// Search Block functions
	// =============================

	async getSearchBlockTextElement( testID ) {
		const child = await this.driver.elementByAccessibilityId( testID );

		if ( isAndroid() ) {
			// Get the child EditText element of the ViewGroup returned by
			// elementByAccessibilityId.
			return await child.elementByClassName( 'android.widget.EditText' );
		}

		return child;
	}

	async sendTextToSearchBlockChild( testID, text ) {
		const textViewElement = await this.getSearchBlockTextElement( testID );
		return await typeString( this.driver, textViewElement, text );
	}

	async toggleHideSearchLabelSetting( block ) {
		await this.openBlockSettings( block );

		const elementName = isAndroid() ? '//*' : '//XCUIElementTypeOther';

		const hideSearchHeadingToggleLocator = `${ elementName }[starts-with(@${ this.accessibilityIdXPathAttrib }, "Hide search heading")]`;
		return await clickIfClickable(
			this.driver,
			hideSearchHeadingToggleLocator
		);
	}

	async changeSearchButtonPositionSetting( block, buttonPosition ) {
		await this.openBlockSettings( block );

		const elementName = isAndroid() ? '//*' : '//XCUIElementTypeButton';

		const optionMenuLocator = `${ elementName }[starts-with(@${ this.accessibilityIdXPathAttrib }, "Button position")]`;
		await clickIfClickable( this.driver, optionMenuLocator );

		const optionMenuButtonLocator = `${ elementName }[contains(@${ this.accessibilityIdXPathAttrib }, "${ buttonPosition }")]`;
		return await clickIfClickable( this.driver, optionMenuButtonLocator );
	}

	async toggleSearchIconOnlySetting( block ) {
		await this.openBlockSettings( block );

		const elementName = isAndroid() ? '//*' : '//XCUIElementTypeOther';

		const useIconButtonLocator = `${ elementName }[starts-with(@${ this.accessibilityIdXPathAttrib }, "Use icon button")]`;
		return await clickIfClickable( this.driver, useIconButtonLocator );
	}

	async isSearchSettingsVisible() {
		const elementName = isAndroid() ? '//*' : '//XCUIElementTypeButton';
		const buttonPositionLocator = `${ elementName }[starts-with(@${ this.accessibilityIdXPathAttrib }, "Button position")]`;

		return await waitForVisible( this.driver, buttonPositionLocator );
	}

	// =============================
	// Unsupported Block functions
	// =============================

	async getUnsupportedBlockHelpButton() {
		const accessibilityId = 'Help button';
		const blockLocator = isAndroid()
			? `//android.widget.Button[starts-with(@content-desc, "${ accessibilityId }")]`
			: `//XCUIElementTypeButton[@name="${ accessibilityId }"]`;

		return await waitForVisible( this.driver, blockLocator );
	}

	async getUnsupportedBlockBottomSheetEditButton() {
		const accessibilityId = 'Edit using web editor';
		const blockLocator = isAndroid()
			? `//android.widget.Button[@content-desc="${ accessibilityId }"]`
			: `//XCUIElementTypeButton[@name="${ accessibilityId }"]`;

		return await waitForVisible( this.driver, blockLocator );
	}

	async getUnsupportedBlockWebView() {
		const blockLocator = isAndroid()
			? '//android.webkit.WebView'
			: '//XCUIElementTypeWebView';

		return await waitForVisible( this.driver, blockLocator );
	}

	async stopDriver() {
		await stopDriver( this.driver );
	}

	async sauceJobStatus( allPassed ) {
		await this.driver.sauceJobStatus( allPassed );
	}

	// =========================
	// Shortcode Block functions
	// =========================

	async getShortBlockTextInputAtPosition( blockName, position = 1 ) {
		// iOS needs a click to get the text element
		if ( ! isAndroid() ) {
			const textBlockLocator = `(//XCUIElementTypeButton[contains(@name, "Shortcode Block. Row ${ position }")])`;

			const textBlock = await waitForVisible(
				this.driver,
				textBlockLocator
			);
			await textBlock.click();
		}

		const blockLocator = isAndroid()
			? `//android.view.ViewGroup[@content-desc="Shortcode Block. Row ${ position }"]/android.view.ViewGroup/android.view.ViewGroup/android.widget.EditText`
			: `//XCUIElementTypeButton[contains(@name, "Shortcode Block. Row ${ position }")]//XCUIElementTypeTextView`;

		return await waitForVisible( this.driver, blockLocator );
	}
}

const blockNames = {
	audio: 'Audio',
	columns: 'Columns',
	cover: 'Cover',
	embed: 'Embed',
	file: 'File',
	gallery: 'Gallery',
	heading: 'Heading',
	image: 'Image',
	latestPosts: 'Latest Posts',
	list: 'List',
	listItem: 'List item',
	more: 'More',
	paragraph: 'Paragraph',
	search: 'Search',
	separator: 'Separator',
	spacer: 'Spacer',
	verse: 'Verse',
	shortcode: 'Shortcode',
};

module.exports = { initializeEditorPage, blockNames };
