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
export async function setClipboardData(
	this: PageUtils,
	{ plainText = '', html = '' }
) {
	clipboardDataHolder = {
		'text/plain': plainText,
		'text/html': html,
		'rich-text': '',
	};

	// Set the clipboard data for the keyboard press below.
	// This is needed for the `paste` event to be fired in case of a real key press.
	await this.page.evaluate( ( data ) => {
		const activeElement =
			document.activeElement instanceof HTMLIFrameElement
				? document.activeElement.contentDocument!.activeElement
				: document.activeElement;
		activeElement?.addEventListener(
			'copy',
			( event ) => {
				event.preventDefault();
				event.stopImmediatePropagation();
				Object.entries( data ).forEach( ( [ type, text ] ) => {
					if ( text ) {
						( event as ClipboardEvent ).clipboardData?.setData(
							type,
							text
						);
					}
				} );
			},
			{ once: true, capture: true }
		);
	}, clipboardDataHolder );

	await this.page.keyboard.press(
		isAppleOS() ? 'Meta+KeyC' : 'Control+KeyC'
	);
}

async function emulateClipboard( page: Page, type: 'copy' | 'cut' | 'paste' ) {
	clipboardDataHolder = await page.evaluate(
		( [ _type, _clipboardData ] ) => {
			const canvasDoc =
				document.activeElement instanceof HTMLIFrameElement
					? document.activeElement.contentDocument!
					: document;
			const clipboardDataTransfer = new DataTransfer();

			if ( _type === 'paste' ) {
				clipboardDataTransfer.setData(
					'text/plain',
					_clipboardData[ 'text/plain' ]
				);
				clipboardDataTransfer.setData(
					'text/html',
					_clipboardData[ 'text/html' ]
				);
				clipboardDataTransfer.setData(
					'rich-text',
					_clipboardData[ 'rich-text' ]
				);
			} else {
				const selection = canvasDoc.defaultView!.getSelection()!;
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
				clipboardDataTransfer.setData( 'text/plain', plainText );
				clipboardDataTransfer.setData( 'text/html', html );
			}

			canvasDoc.activeElement?.dispatchEvent(
				new ClipboardEvent( _type, {
					bubbles: true,
					cancelable: true,
					clipboardData: clipboardDataTransfer,
				} )
			);

			return {
				'text/plain': clipboardDataTransfer.getData( 'text/plain' ),
				'text/html': clipboardDataTransfer.getData( 'text/html' ),
				'rich-text': clipboardDataTransfer.getData( 'rich-text' ),
			};
		},
		[ type, clipboardDataHolder ] as const
	);
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

	let command = () => this.page.keyboard.press( normalizedKeys );

	if ( key.toLowerCase() === 'primary+c' ) {
		command = () => emulateClipboard( this.page, 'copy' );
	} else if ( key.toLowerCase() === 'primary+x' ) {
		command = () => emulateClipboard( this.page, 'cut' );
	} else if ( key.toLowerCase() === 'primary+v' ) {
		command = async () => {
			/**
			 * `emulateClipboard()` will not work if the element doesn't have a
			 * `paste` event handler. In that case, we need to do a real key press.
			 * We listen for the bubbled `paste` event on the active document to
			 * determine if the element has a `paste` event handler. This won't work
			 * if the event handler calls `event.stopPropagation()`, but it's good
			 * enough for our use cases for now.
			 */
			const handledPromise = this.page.evaluate( () => {
				const activeElement =
					document.activeElement instanceof HTMLIFrameElement
						? document.activeElement.contentDocument!.activeElement
						: document.activeElement;
				return new Promise( ( resolve ) => {
					const animationFrame = requestAnimationFrame( () => {
						resolve( false );
					} );
					activeElement?.ownerDocument.addEventListener(
						'paste',
						( event ) => {
							cancelAnimationFrame( animationFrame );
							resolve( !! event.defaultPrevented );
						},
						{ once: true }
					);
				} );
			} );
			await emulateClipboard( this.page, 'paste' );
			const handled = await handledPromise;
			if ( ! handled ) {
				await this.page.keyboard.press( normalizedKeys );
			}
		};
	}

	times = times ?? 1;
	for ( let i = 0; i < times; i += 1 ) {
		await command();

		if ( times > 1 && pressOptions.delay ) {
			// Disable reason: We explicitly want to wait for a specific amount of time.
			// eslint-disable-next-line playwright/no-wait-for-timeout
			await this.page.waitForTimeout( pressOptions.delay );
		}
	}
}
