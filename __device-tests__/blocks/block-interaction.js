/** @flow
 * @format */

/**
 * External dependencies
 */
import wd from 'wd';
/**
 * Internal dependencies
 */
import { isAndroid } from '../helpers/utils';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

// Common code across used to interact with all blocks
export default class BlockInteraction {
	driver: wd.PromiseChainWebdriver;
	accessibilityIdKey: string;
	name: string;
	blockName: string;
	element: wd.PromiseChainWebdriver.Element;
	accessibilityId: string;
	accessibilityIdXPathAttrib: string;
	static index = 0;

	constructor( driver: wd.PromiseChainWebdriver, name: string = 'Unsupported Block' ) {
		this.driver = driver;
		this.accessibilityIdKey = 'name';
		this.accessibilityIdXPathAttrib = 'name';
		this.name = name;

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
		const blockLocator = `block-${ BlockInteraction.index }-${ blockName }`;
		this.element = await this.driver.elementByAccessibilityId( blockLocator );
		this.accessibilityId = await this.getAttribute( this.accessibilityIdKey );

		BlockInteraction.index += 1;
		return blocks;
	}

	async loadBlockAtPosition( position: number, blockName: string, block: BlockInteraction ) {
		const blockLocator = `block-${ position }-${ blockName }`;
		block.element = await this.driver.elementByAccessibilityId( blockLocator );
		block.accessibilityId = await this.getAttribute( this.accessibilityIdKey );
		await block.setup();
		await this.driver.elementByAccessibilityId( this.accessibilityId );
	}

	async moveBlockUp() {
		const moveUpButton = await this.driver.elementByAccessibilityId( __( `Move ${ this.accessibilityId } up` ) );
		await moveUpButton.click();
	}

	async moveBlockDown() {
		const moveDownButton = await this.driver.elementByAccessibilityId( __( `Move ${ this.accessibilityId } down` ) );
		await moveDownButton.click();
	}

	// Block will no longer be present if this succeeds
	async removeBlock() {
		const removeButton = await this.driver.elementByAccessibilityId( __( `Remove ${ this.accessibilityId }` ) );
		await removeButton.click();
		BlockInteraction.index -= 1;
	}
}

