/** @flow
 * @format */

import wd from 'wd';
import { isAndroid, setDifference } from '../helpers/utils';

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

	async setup() {
		throw 'Unimplemented setup function for this block';
	}

	async getAttribute( attributeName: string ) {
		return await this.element.getAttribute( attributeName );
	}

	// Finds the wd element for new block that was added and sets the element attribute on this object
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

	async typeString( element: wd.PromiseChainWebdriver.Element, str: string ) {
		await element.clear();
		if ( isAndroid() ) {
			return await element.type( str );
		}
		// iOS: Problem with Appium type function Requiring me to do a little hacking to get it work,
		// as a result typing on iOS will be slower
		for ( let i = 0; i < str.length; i++ ) {
			await element.type( str.charAt( i ) );
		}
	}
}
