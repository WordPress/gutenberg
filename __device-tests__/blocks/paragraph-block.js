import Block from "./block";

export default class ParagraphBlock extends Block { 
    static var blocks = new Set([]);

    constructor( driver, name = "Unsupported Block" ) {
        this.driver = driver; 
        this.name = name; // name in block picker list
        this.element = null;
        this.blockName = 'core/paragraph';
        this.accessibilityId = null; // Block accessibility ID
    }

    async getAttribute( attributeName ) {
        return await this.element.getAttribute( attributeName );
    }

    // Finds the wd element for new block that was added and sets the element attribute on this object
    async setupElement() {
        console.log("getNewParagraphBlock");
	
		await driver.sleep(2000);
		const blockLocator = `//*[starts-with(@${accessibilityIdKey}, '${this.blockName}')]`
		let paragraphBlocks = await driver.elementsByXPath(blockLocator);

		var currentBlocks = new Set([]);

		for (const paragraphBlock of paragraphBlocks) {
			const elementID = await paragraphBlock.getAttribute(accessibilityIdKey);
			currentBlocks.add(elementID);
		}

		var newBlocks = currentBlocks.difference(blocks);
		if(newBlocks.size === 0) {
			newBlocks = blocks.difference(currentBlocks);
		}

		var newElementAccessibilityId = newBlocks.values().next().value;
		const newElement = await driver.elementByAccessibilityId(newElementAccessibilityId);
		blocks = currentBlocks;
        this.element = newElement;
        this.blockId = this.getAttribute( super.accessibilityIdKey )
    }

    // gets the TextView wd element for this paragraph block and sets it to
    // the textViewElement attribute for this object
    async setupTextView() {
        console.log("getParagraphBlocktextTextView");
	
		await driver.sleep(2000);
		var textViewElement = 'XCUIElementTypeTextView';
		if(rnPlatform === 'android') {
			textViewElement = 'android.widget.EditText';
		}
		const blockLocator = "//*[starts-with(@"+ super.accessibilityIdKey+", '"+ this.accessibilityId +"')]//" + textViewElement;
		this.textViewElement = await driver.elementByXPath(blockLocator);
    }

    async setup() { 
        await setupElement();
        await setupTextView();
    }

    async sendText( str ) {
        return await super.typeString(this.textViewElement, str );
    }
}