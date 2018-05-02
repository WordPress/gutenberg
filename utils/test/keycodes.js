/**
 * Internal dependencies
 */
import {
	ALT,
	PRIMARY,
	META,
	SHIFT,
	accessShortcut,
	metaShortcut,
	primaryShortcut,
	primaryAccessShortcut,
	primaryAltShortcut,
	keyboardShortcut,
	isMacOS,
} from '../keycodes';

const isMacOSFalse = () => false;
const isMacOSTrue = () => true;

describe( 'keyboardShortcut', () => {
	const macShortcut = ( keyString ) => keyboardShortcut( keyString, isMacOSTrue );
	const windowsShortcut = ( keyString ) => keyboardShortcut( keyString, isMacOSFalse );

	it( 'should split string by "+" character', () => {
		expect( macShortcut( `${ PRIMARY }+S` ) ).toEqual( '⌘S' );
	} );

	it( 'should remove whitespace from string', () => {
		expect( macShortcut( `${ PRIMARY }+ S` ) ).toEqual( '⌘S' );
	} );

	// TODO: Make a generic version outside of Windows as a fallback so we
	// don't, for instance, show the Windows logo to Ubuntu users, etc.
	describe( 'Windows/Other Platforms', () => {
		it( 'should output Ctrl for PRIMARY key', () => {
			const shortcut = windowsShortcut( PRIMARY );
			expect( shortcut ).toEqual( 'Ctrl' );
		} );

		it( 'should output Alt for ALT key', () => {
			const shortcut = windowsShortcut( ALT );
			expect( shortcut ).toEqual( 'Alt' );
		} );

		it( 'should output Windows Unicode for META key', () => {
			const shortcut = windowsShortcut( META );
			expect( shortcut ).toEqual( '⊞' );
		} );

		it( 'should output Shift for SHIFT key', () => {
			const shortcut = windowsShortcut( SHIFT );
			expect( shortcut ).toEqual( 'Shift' );
		} );

		it( 'should combine keys with "+" character', () => {
			const shortcut = windowsShortcut( `${ PRIMARY }+${ ALT }+B` );
			expect( shortcut ).toEqual( 'Ctrl+Alt+B' );
		} );
	} );

	describe( 'MacOS', () => {
		it( 'should output MacOS Clover for PRIMARY key', () => {
			const shortcut = macShortcut( PRIMARY );
			expect( shortcut ).toEqual( '⌘' );
		} );

		it( 'should output option symbol for ALT key', () => {
			const shortcut = macShortcut( ALT );
			expect( shortcut ).toEqual( '⌥' );
		} );

		it( 'should output control caret for META key', () => {
			const shortcut = macShortcut( META );
			expect( shortcut ).toEqual( '⌃' );
		} );

		it( 'should output Shift unicode for SHIFT key', () => {
			const shortcut = macShortcut( SHIFT );
			expect( shortcut ).toEqual( '⇧' );
		} );

		it( 'should combine keys with no character', () => {
			const shortcut = macShortcut( `${ PRIMARY }+${ ALT }+B` );
			expect( shortcut ).toEqual( '⌘⌥B' );
		} );
	} );
} );

describe( 'accessShortcut', () => {
	it( 'should output Shift+Alt text on Windows', () => {
		const shortcut = accessShortcut( 'M', isMacOSFalse );
		expect( shortcut ).toEqual( 'Shift+Alt+M' );
	} );

	it( 'should output control+option symbols on MacOS', () => {
		const shortcut = accessShortcut( 'M', isMacOSTrue );
		expect( shortcut ).toEqual( '⌃⌥M' );
	} );
} );

describe( 'metaShortcut', () => {
	it( 'should output Windows logo symbol on Windows', () => {
		const shortcut = metaShortcut( 'M', isMacOSFalse );
		expect( shortcut ).toEqual( '⊞+M' );
	} );

	it( 'should output control symbol on MacOS', () => {
		const shortcut = metaShortcut( 'M', isMacOSTrue );
		expect( shortcut ).toEqual( '⌃M' );
	} );
} );

describe( 'primaryShortcut', () => {
	it( 'should output Control text on Windows', () => {
		const shortcut = primaryShortcut( 'M', isMacOSFalse );
		expect( shortcut ).toEqual( 'Ctrl+M' );
	} );

	it( 'should output control symbol on MacOS', () => {
		const shortcut = primaryShortcut( 'M', isMacOSTrue );
		expect( shortcut ).toEqual( '⌘M' );
	} );
} );

describe( 'primaryAccessShortcut', () => {
	it( 'should output control+shift+alt text on Windows', () => {
		const shortcut = primaryAccessShortcut( 'M', isMacOSFalse );
		expect( shortcut ).toEqual( 'Ctrl+Shift+Alt+M' );
	} );

	it( 'should output option+shift+command symbols on MacOS', () => {
		const shortcut = primaryAccessShortcut( 'M', isMacOSTrue );
		expect( shortcut ).toEqual( '⌥⇧⌘M' );
	} );
} );

describe( 'primaryAltShortcut', () => {
	it( 'should output control+alt text on Windows', () => {
		const shortcut = primaryAltShortcut( 'M', isMacOSFalse );
		expect( shortcut ).toEqual( 'Ctrl+Alt+M' );
	} );

	it( 'should output option+command symbols on MacOS', () => {
		const shortcut = primaryAltShortcut( 'M', isMacOSTrue );
		expect( shortcut ).toEqual( '⌥⌘M' );
	} );
} );

describe( 'isMacOS helper', () => {
	it( 'should identify anything with "Mac" in it as MacOS', () => {
		expect( isMacOS( { navigator: { platform: 'Mac' } } ) ).toEqual( true );
		expect( isMacOS( { navigator: { platform: 'MacIntel' } } ) ).toEqual( true );
	} );

	it( 'should not identify Windows as MacOS', () => {
		expect( isMacOS( { navigator: { platform: 'Windows' } } ) ).toEqual( false );
		expect( isMacOS( { navigator: { platform: 'Win' } } ) ).toEqual( false );
	} );

	it( 'should not identify *NIX as MacOS', () => {
		expect( isMacOS( { navigator: { platform: 'Linux' } } ) ).toEqual( false );
		expect( isMacOS( { navigator: { platform: 'Unix' } } ) ).toEqual( false );
	} );

	it( 'should not identify other cases as MacOS', () => {
		expect( isMacOS( { navigator: { platform: 'MAC' } } ) ).toEqual( false );
		expect( isMacOS( { navigator: { platform: 'mac' } } ) ).toEqual( false );
	} );
} );
