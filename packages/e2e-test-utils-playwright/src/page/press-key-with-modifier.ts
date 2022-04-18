/**
 * External dependencies
 */
import { capitalize } from 'lodash';
import type { Page } from '@playwright/test';

/**
 * WordPress dependencies
 */
import { modifiers, SHIFT, ALT, CTRL } from '@wordpress/keycodes';
import type { WPKeycodeModifier } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import type { PageUtils } from './index';

let clipboardDataHolder: {
	plainText: string;
	html: string;
} = {
	plainText: '',
	html: '',
};

/**
 * Sets the clipboard data that can be pasted with
 * `pressKeyWithModifier( 'primary', 'v' )`.
 *
 * @param  this
 * @param  clipboardData
 * @param  clipboardData.plainText
 * @param  clipboardData.html
 */
export function setClipboardData(
	this: PageUtils,
	{ plainText = '', html = '' }: typeof clipboardDataHolder
) {
	clipboardDataHolder = {
		plainText,
		html,
	};
}

async function emulateClipboard( page: Page, type: 'copy' | 'cut' | 'paste' ) {
	clipboardDataHolder = await page.evaluate(
		( [ _type, _clipboardData ] ) => {
			const clipboardDataTransfer = new DataTransfer();

			if ( _type === 'paste' ) {
				clipboardDataTransfer.setData(
					'text/plain',
					_clipboardData.plainText
				);
				clipboardDataTransfer.setData(
					'text/html',
					_clipboardData.html
				);
			} else {
				const selection = window.getSelection()!;
				const plainText = selection.toString();
				let html = plainText;
				if ( selection.rangeCount ) {
					const range = selection.getRangeAt( 0 );
					const fragment = range.cloneContents();
					html = Array.from( fragment.childNodes )
						.map( ( node ) =>
							Object.prototype.hasOwnProperty.call(
								node,
								'outerHTML'
							)
								? ( node as Element ).outerHTML
								: node.nodeValue
						)
						.join( '' );
				}
				clipboardDataTransfer.setData( 'text/plain', plainText );
				clipboardDataTransfer.setData( 'text/html', html );
			}

			document.activeElement?.dispatchEvent(
				new ClipboardEvent( _type, {
					bubbles: true,
					cancelable: true,
					clipboardData: clipboardDataTransfer,
				} )
			);

			return {
				plainText: clipboardDataTransfer.getData( 'text/plain' ),
				html: clipboardDataTransfer.getData( 'text/html' ),
			};
		},
		[ type, clipboardDataHolder ] as const
	);
}

/**
 * Performs a key press with modifier (Shift, Control, Meta, Alt), where each modifier
 * is normalized to platform-specific modifier.
 *
 * @param  this
 * @param  modifier
 * @param  key
 */
export async function pressKeyWithModifier(
	this: PageUtils,
	modifier: WPKeycodeModifier,
	key: string
) {
	if ( modifier.toLowerCase() === 'primary' && key.toLowerCase() === 'c' ) {
		return await emulateClipboard( this.page, 'copy' );
	}

	if ( modifier.toLowerCase() === 'primary' && key.toLowerCase() === 'x' ) {
		return await emulateClipboard( this.page, 'cut' );
	}

	if ( modifier.toLowerCase() === 'primary' && key.toLowerCase() === 'v' ) {
		return await emulateClipboard( this.page, 'paste' );
	}

	const isAppleOS = () => process.platform === 'darwin';
	const overWrittenModifiers = {
		...modifiers,
		shiftAlt: ( _isApple: () => boolean ) =>
			_isApple() ? [ SHIFT, ALT ] : [ SHIFT, CTRL ],
	};
	const mappedModifiers = overWrittenModifiers[ modifier ](
		isAppleOS
	).map( ( keycode ) =>
		keycode === CTRL ? 'Control' : capitalize( keycode )
	);

	await this.page.keyboard.press(
		`${ mappedModifiers.join( '+' ) }+${ key }`
	);
}
