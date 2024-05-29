/**
 * External dependencies
 */
import { capitalCase } from 'change-case';
import type { Page } from '@playwright/test';

/**
 * Internal dependencies
 */
import type { PageUtils } from './';

/**
 * WordPress dependencies
 */
import {
	modifiers as baseModifiers,
	SHIFT,
	ALT,
	CTRL,
} from '@wordpress/keycodes';

let clipboardDataHolder: {
	'text/plain': string;
	'text/html': string;
	'rich-text': string;
} = {
	'text/plain': '',
	'text/html': '',
	'rich-text': '',
};

/**
 * Sets the clipboard data that can be pasted with
 * `pressKeys( 'primary+v' )`.
 *
 * @param this
 * @param clipboardData
 * @param clipboardData.plainText
 * @param clipboardData.html
 */
export function setClipboardData(
	this: PageUtils,
	{ plainText = '', html = '' }
) {
	clipboardDataHolder = {
		'text/plain': plainText,
		'text/html': html,
		'rich-text': '',
	};
}

async function emulateClipboard( page: Page, type: 'copy' | 'cut' | 'paste' ) {
	const output = await page.evaluate(
		( [ _type, _clipboardData ] ) => {
			const canvasDoc =
				// @ts-ignore
				document.activeElement?.contentDocument ?? document;
			const event = new ClipboardEvent( _type, {
				bubbles: true,
				cancelable: true,
				clipboardData: new DataTransfer(),
			} );

			if ( ! event.clipboardData ) {
				throw new Error( 'ClipboardEvent.clipboardData is null' );
			}

			if ( _type === 'paste' ) {
				event.clipboardData.setData(
					'text/plain',
					_clipboardData[ 'text/plain' ]
				);
				event.clipboardData.setData(
					'text/html',
					_clipboardData[ 'text/html' ]
				);
				event.clipboardData.setData(
					'rich-text',
					_clipboardData[ 'rich-text' ]
				);
			} else {
				const selection = canvasDoc.defaultView.getSelection()!;
				const plainText = selection.toString();
				let html = plainText;
				if ( selection.rangeCount ) {
					const range = selection.getRangeAt( 0 );
					const fragment = range.cloneContents();
					html = Array.from( fragment.childNodes )
						.map(
							( node ) =>
								( node as Element ).outerHTML ??
								( node as Element ).nodeValue
						)
						.join( '' );
				}
				event.clipboardData.setData( 'text/plain', plainText );
				event.clipboardData.setData( 'text/html', html );
			}

			canvasDoc.activeElement.dispatchEvent( event );

			if ( _type === 'paste' ) {
				return event.defaultPrevented;
			}

			return {
				'text/plain': event.clipboardData.getData( 'text/plain' ),
				'text/html': event.clipboardData.getData( 'text/html' ),
				'rich-text': event.clipboardData.getData( 'rich-text' ),
			};
		},
		[ type, clipboardDataHolder ] as const
	);

	if ( typeof output === 'object' ) {
		clipboardDataHolder = output;
	}

	if ( output === false ) {
		// Emulate paste by typing the clipboard content, which works across all
		// elements and documents (keyboard.type does uses the nested active
		// element automatically).
		await page.keyboard.type( clipboardDataHolder[ 'text/plain' ] );
	}
}

const isAppleOS = () => process.platform === 'darwin';

const isWebkit = ( page: Page ) =>
	page.context().browser()!.browserType().name() === 'webkit';

const browserCache = new WeakMap();
const getHasNaturalTabNavigation = async ( page: Page ) => {
	if ( ! isAppleOS() || ! isWebkit( page ) ) {
		return true;
	}
	if ( browserCache.has( page.context().browser()! ) ) {
		return browserCache.get( page.context().browser()! );
	}
	const testPage = await page.context().newPage();
	await testPage.setContent( `<button>1</button><button>2</button>` );
	await testPage.getByText( '1' ).focus();
	await testPage.keyboard.press( 'Tab' );
	const featureDetected = await testPage
		.getByText( '2' )
		.evaluate( ( node ) => node === document.activeElement );
	browserCache.set( page.context().browser()!, featureDetected );
	await testPage.close();
	return featureDetected;
};

type Options = {
	times?: number;
	delay?: number;
};

const modifiers = {
	...baseModifiers,
	shiftAlt: ( _isApple: () => boolean ) =>
		_isApple() ? [ SHIFT, ALT ] : [ SHIFT, CTRL ],
};

export async function pressKeys(
	this: PageUtils,
	key: string,
	{ times, ...pressOptions }: Options = {}
) {
	const hasNaturalTabNavigation = await getHasNaturalTabNavigation(
		this.page
	);

	let command: () => Promise< void >;

	if ( key.toLowerCase() === 'primary+c' ) {
		command = () => emulateClipboard( this.page, 'copy' );
	} else if ( key.toLowerCase() === 'primary+x' ) {
		command = () => emulateClipboard( this.page, 'cut' );
	} else if ( key.toLowerCase() === 'primary+v' ) {
		command = () => emulateClipboard( this.page, 'paste' );
	} else {
		const keys = key.split( '+' ).flatMap( ( keyCode ) => {
			if ( Object.prototype.hasOwnProperty.call( modifiers, keyCode ) ) {
				return modifiers[ keyCode as keyof typeof modifiers ](
					isAppleOS
				).map( ( modifier ) =>
					modifier === CTRL ? 'Control' : capitalCase( modifier )
				);
			} else if ( keyCode === 'Tab' && ! hasNaturalTabNavigation ) {
				return [ 'Alt', 'Tab' ];
			}
			return keyCode;
		} );
		const normalizedKeys = keys.join( '+' );
		command = () => this.page.keyboard.press( normalizedKeys );
	}

	times = times ?? 1;
	for ( let i = 0; i < times; i += 1 ) {
		await command();

		if ( times > 1 && pressOptions.delay ) {
			await this.page.waitForTimeout( pressOptions.delay );
		}
	}
}
