import { describe, expect, it } from 'vitest';
import {
	getMenuShortcut,
	getMenuShortcutFromDisplay,
	matchesSearch,
} from '../utils';

describe( 'getMenuShortcut', () => {
	it( 'builds the display, ARIA and label forms of a shortcut', () => {
		const shortcut = getMenuShortcut( 'primary', 'g' );
		expect( shortcut.ariaKeyShortcut ).toMatch( /\+G$/i );
		expect( shortcut.displayShortcut ).toMatch( /G$/i );
		expect( shortcut.label ).toBeTruthy();
	} );
} );

describe( 'getMenuShortcutFromDisplay', () => {
	it( 'returns nothing without a shortcut', () => {
		expect( getMenuShortcutFromDisplay( undefined ) ).toBeUndefined();
		expect( getMenuShortcutFromDisplay( '' ) ).toBeUndefined();
		expect(
			getMenuShortcutFromDisplay( { display: 'x' } )
		).toBeUndefined();
	} );

	it( 'uses the displayed shortcut as its label', () => {
		expect( getMenuShortcutFromDisplay( '⌘B' ) ).toEqual( {
			displayShortcut: '⌘B',
			ariaKeyShortcut: undefined,
			label: '⌘B',
		} );
	} );
} );

describe( 'matchesSearch', () => {
	it( 'matches labels case-insensitively', () => {
		expect( matchesSearch( 'Block before', 'before' ) ).toBe( true );
		expect( matchesSearch( 'Paste styles', 'styles' ) ).toBe( true );
		expect( matchesSearch( 'Duplicate', 'group' ) ).toBe( false );
	} );
} );
