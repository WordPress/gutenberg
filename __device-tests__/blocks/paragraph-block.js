import Block from './block';

export default class ParagraphBlock extends Block {
	static blocks = new Set( [] );

	constructor( driver, name = 'Unsupported Block' ) {
		super( driver );
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
		await this.driver.sleep( 2000 );
		const blockLocator = `//*[starts-with(@${ this.accessibilityIdKey }, '${ this.blockName }')]`;
		const paragraphBlocks = await this.driver.elementsByXPath( blockLocator );

		const currentBlocks = new Set( [] );

		for ( const paragraphBlock of paragraphBlocks ) {
			const elementID = await paragraphBlock.getAttribute( this.accessibilityIdKey );
			currentBlocks.add( elementID );
		}

		let newBlocks = currentBlocks.difference( ParagraphBlock.blocks );
		if ( newBlocks.size === 0 ) {
			newBlocks = ParagraphBlock.blocks.difference( currentBlocks );
		}

		const newElementAccessibilityId = newBlocks.values().next().value;
		const newElement = await this.driver.elementByAccessibilityId( newElementAccessibilityId );
		ParagraphBlock.blocks = currentBlocks;
		this.element = newElement;
		this.accessibilityId = await this.getAttribute( this.accessibilityIdKey );
	}

	// gets the TextView wd element for this paragraph block and sets it to
	// the textViewElement attribute for this object
	async setupTextView() {
		await this.driver.sleep( 2000 );
		let textViewElement = 'XCUIElementTypeTextView';
		if ( this.rnPlatform === 'android' ) {
			textViewElement = 'android.widget.EditText';
		}
		const blockLocator = '//*[starts-with(@' + this.accessibilityIdKey + ", '" + this.accessibilityId + "')]//" + textViewElement;
		this.textViewElement = await this.driver.elementByXPath( blockLocator );
	}

	async setup() {
		await this.setupElement();
		await this.setupTextView();
	}

	async sendText( str ) {
		return await this.typeString( this.textViewElement, str );
	}

	async getText() {
		const text = await this.textViewElement.text();
		return text.toString().trim();
	}
}
