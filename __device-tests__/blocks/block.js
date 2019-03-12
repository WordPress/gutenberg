/** @flow
 * @format */

import wd from 'wd';

export default class Block {
	driver: wd.PromiseChainWebdriver;
	rnPlatform: string;
	accessibilityIdKey: string;
	name: string;
	blockName: string;
	defaultPlatform: string;
	element: wd.PromiseChainWebdriver.Element;
	accessibilityId: string;

	constructor( driver: wd.PromiseChainWebdriver ) {
		this.driver = driver;
		this.accessibilityIdKey = 'name';
		this.defaultPlatform = 'android';

		this.rnPlatform = process.env.TEST_RN_PLATFORM || this.defaultPlatform;
		if ( this.rnPlatform === 'android' ) {
			this.accessibilityIdKey = 'content-desc';
		}
	}

	setDifference( set1: Set<string>, set2: Set<string> ) {
		const differenceSet = new Set<string>();

		for ( const elem of set1 ) {
			// if the value[i] is not present
			// in nextSet add to the differenceSet
			if ( ! set2.has( elem ) ) {
				differenceSet.add( elem );
			}
		}

		// returns values of differenceSet
		return differenceSet;
	}

	async setup() {
		throw 'Unimplemented setup function for this block';
	}

	async getAttribute( attributeName: string ) {
		return await this.element.getAttribute( attributeName );
	}

	// Finds the wd element for new block that was added and sets the element attribute on this object
	async setupElement( blockName: string, blocks: Set<string> ) {
		await this.driver.sleep( 2000 );
		const blockLocator = `//*[starts-with(@${ this.accessibilityIdKey }, '${ blockName }')]`;
		const paragraphBlocks = await this.driver.elementsByXPath( blockLocator );

		const currentBlocks = new Set( [] );

		for ( const paragraphBlock of paragraphBlocks ) {
			const elementID = await paragraphBlock.getAttribute( this.accessibilityIdKey );
			currentBlocks.add( elementID );
		}

		let newBlocks = this.setDifference( currentBlocks, blocks );

		if ( newBlocks.size === 0 ) {
			newBlocks = this.setDifference( blocks, currentBlocks );
		}

		const newElementAccessibilityId = newBlocks.values().next().value;
		this.element = await this.driver.elementByAccessibilityId( newElementAccessibilityId );
		this.accessibilityId = await this.getAttribute( this.accessibilityIdKey );

		return blocks;
	}

	async typeString( element: wd.PromiseChainWebdriver.Element, str: string ) {
		if ( this.rnPlatform === 'android' ) {
			await element.clear();
			return await element.type( str );
		}
		// iOS: Problem with Appium type function Requiring me to do a little hacking to get it work,
		// as a result typing on iOS will be slower
		for ( let i = 0; i < str.length; i++ ) {
			await element.type( str.charAt( i ) );
		}
	}
}
