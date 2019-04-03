/** @flow
 * @format */

/**
 * Internal dependencies
 */
import BlockInteraction from './block-interaction';

/**
 * External dependencies
 */
import wd from 'wd';
import { isAndroid, typeString } from '../helpers/utils';
import _ from 'underscore';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export default class ParagraphBlockInteraction extends BlockInteraction {
	// FLow complaining about type annotation on Set class here but Set<string>(); doesn't resolve
	// $FlowFixMe
	static blocks = new Set();
	textViewElement: wd.PromiseChainWebdriver.Element;

	constructor( driver: wd.PromiseChainWebdriver ) {
		super( driver, __( 'Paragraph' ) );
		this.driver = driver;
		this.blockName = 'core/paragraph';
	}

	// gets the TextView wd element for this paragraph block and sets it to
	// the textViewElement attribute for this object
	async setupTextView() {
		await this.driver.sleep( 2000 );
		let textViewElement = 'XCUIElementTypeTextView';
		if ( isAndroid() ) {
			textViewElement = 'android.widget.EditText';
		}
		const blockLocator = `//*[@${ this.accessibilityIdXPathAttrib }="${ this.accessibilityId }"]//${ textViewElement }`;
		this.textViewElement = await this.driver.elementByXPath( blockLocator );
	}

	async setup() {
		if ( ! _.isUndefined( this.accessibilityId ) ) {
			await this.setupElement( this.blockName, ParagraphBlockInteraction.blocks );
		}

		await this.setupTextView();
	}

	async sendText( str: string ) {
		const paragraphs = str.split( '\n' );
		if ( paragraphs.length === 1 ) {
			return await typeString( this.textViewElement, str );
		}
		const textViewElement = this.textViewElement;
		for ( const paragraph in paragraphs ) {
			await typeString( textViewElement, paragraph );
			await typeString( textViewElement, '\n' );
			BlockInteraction.index += 1;
			const newBlock = ParagraphBlockInteraction( this.driver );
			await this.loadBlockAtPosition( BlockInteraction.index, this.blockName, newBlock );
		}
	}

	async getText() {
		const text = await this.textViewElement.text();
		return text.toString().trim();
	}
}
