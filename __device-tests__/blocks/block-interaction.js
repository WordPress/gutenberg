/** @flow
 * @format */

import wd from 'wd';
import { isAndroid, setDifference } from '../helpers/utils';

// Common code across used to interact with all blocks
export default class BlockInteraction {
	driver: wd.PromiseChainWebdriver;
	accessibilityIdKey: string;
	name: string;
	blockName: string;
	element: wd.PromiseChainWebdriver.Element;
	accessibilityId: string;
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

	// Each subclass must include a method to do the following:
	// * Initialise the element and accessibilityId(By calling this.setupElement in most cases)
	// * Initialise any elements specific to interactions with that block
	async setup() {
		throw 'Unimplemented setup function for this block';
	}

	async getAttribute( attributeName: string ) {
		return await this.element.getAttribute( attributeName );
	}

	// Finds the wd element for new block that was added and sets the element attribute
	// and accessibilityId attributes on this object
	async setupElement( blockName: string, blocks: Set<string> ) {
		await this.driver.sleep( 2000 );
		const blockLocator = `//*[starts-with(@${ this.accessibilityIdXPathAttrib }, '${ blockName }')]`;
		const paragraphBlocks = await this.driver.elementsByXPath( blockLocator );

		const currentBlocks = new Set( [] );

		for ( const paragraphBlock of paragraphBlocks ) {
			const elementID = await paragraphBlock.getAttribute( this.accessibilityIdKey );
			currentBlocks.add( elementID );
		}

		let newBlocks = setDifference( currentBlocks, blocks );

		if ( newBlocks.size === 0 ) {
			newBlocks = setDifference( blocks, currentBlocks );
		}

		const newElementAccessibilityId = newBlocks.values().next().value;
		this.element = await this.driver.elementByAccessibilityId( newElementAccessibilityId );
		this.accessibilityId = await this.getAttribute( this.accessibilityIdKey );

		return blocks;
	}

	// attempts to type a string to a given element, need for this stems from
	// https://github.com/appium/appium/issues/12285#issuecomment-471872239
	// https://github.com/facebook/WebDriverAgent/issues/1084
	async typeString( element: wd.PromiseChainWebdriver.Element, str: string ) {
		await element.clear();
		if ( isAndroid() ) {
			return await element.type( str );
		}
		// iOS: Problem with Appium type function requiring me to do a little hacking to get it work,
		// as a result typing on iOS will be slower
		for ( let i = 0; i < str.length; i++ ) {
			await element.type( str.charAt( i ) );
		}
	}
}
