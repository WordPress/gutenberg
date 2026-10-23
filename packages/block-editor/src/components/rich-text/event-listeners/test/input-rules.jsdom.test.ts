import { afterEach, describe, expect, it, vi } from 'vitest';
import inputRules from '../input-rules';
import type { RichTextFormatType, RichTextValue } from '@wordpress/rich-text';
import type { RichTextEventListenerProps } from '../../types';

/**
 * A stand-in for the real `core/code` format's `__unstableInputRule`: it
 * rewrites a backtick-wrapped span the same observable way the real rule
 * turns it into inline code, without depending on `@wordpress/format-library`.
 */
const backtickFormatType = {
	name: 'test/backtick',
	__unstableInputRule( value: RichTextValue ): RichTextValue {
		const BACKTICK = '`';
		const { start, text } = value;

		if ( start === undefined || text[ start - 1 ] !== BACKTICK ) {
			return value;
		}

		const indexBefore = text.lastIndexOf( BACKTICK, start - 2 );

		if ( indexBefore === -1 || indexBefore === start - 2 ) {
			return value;
		}

		return {
			...value,
			text: text.slice( 0, indexBefore ) + 'TRANSFORMED' + text.slice( start ),
		};
	},
} as RichTextFormatType;

function setup( disableFormatInputRules?: boolean ) {
	const onChange = vi.fn();
	const element = document.createElement( 'div' );
	element.contentEditable = 'true';
	element.tabIndex = -1;
	document.body.appendChild( element );

	// Caret after the closing backtick of `some `code``.
	const value = {
		text: 'some `code`',
		start: 11,
		end: 11,
		formats: [],
		replacements: [],
		activeFormats: [],
	} as unknown as RichTextValue;

	const props = {
		registry: {
			dispatch: () => ( {
				__unstableMarkLastChangeAsPersistent: vi.fn(),
				__unstableMarkAutomaticChange: vi.fn(),
			} ),
		},
		getValue: () => value,
		onChange,
		__unstableDisableFormatInputRules: disableFormatInputRules,
		formatTypes: [ backtickFormatType ],
		selectionChange: vi.fn(),
		value,
		tagName: 'div',
		keyboardShortcuts: {},
		inputEvents: {},
	} as unknown as RichTextEventListenerProps;

	const cleanup = inputRules( { current: props } )( element );

	return { element, onChange, cleanup };
}

function typeClosingBacktick( element: HTMLElement ) {
	element.focus();
	element.dispatchEvent(
		new InputEvent( 'input', { inputType: 'insertText', bubbles: true } )
	);
}

describe( 'inputRules', () => {
	afterEach( () => {
		document.body.innerHTML = '';
	} );

	it( 'applies format input rules by default', () => {
		const { element, onChange, cleanup } = setup();

		typeClosingBacktick( element );

		expect( onChange ).toHaveBeenCalledTimes( 1 );
		expect( onChange.mock.calls[ 0 ][ 0 ].text ).toBe( 'some TRANSFORMED' );

		cleanup();
	} );

	it( 'skips format input rules when __unstableDisableFormatInputRules is set', () => {
		const { element, onChange, cleanup } = setup( true );

		typeClosingBacktick( element );

		expect( onChange ).not.toHaveBeenCalled();

		cleanup();
	} );
} );
