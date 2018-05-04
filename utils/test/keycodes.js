/**
 * Internal dependencies
 */
import {
	ALT,
	PRIMARY,
	META,
	SHIFT,
	accessKeyCode,
	accessShortcut,
	isMacOS,
	keyboardShortcut,
	primaryShortcut,
	secondaryKeyCode,
	secondaryShortcut,
} from '../keycodes';

const isMacOSFalse = () => false;
const isMacOSTrue = () => true;

describe( 'keyboardShortcut', () => {
	const macShortcut = ( keyString ) => keyboardShortcut( keyString, isMacOSTrue );
	const windowsShortcut = ( keyString ) => keyboardShortcut( keyString, isMacOSFalse );

	it( 'should split string by "+" character', () => {
		expect( windowsShortcut( `${ PRIMARY }+S` ) ).toEqual( 'Ctrl+S' );
	} );

	it( 'should remove whitespace from string', () => {
		expect( windowsShortcut( `${ PRIMARY }+ S` ) ).toEqual( 'Ctrl+S' );
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
			expect( shortcut ).toEqual( '⌥option' );
		} );

		it( 'should output control caret for META key', () => {
			const shortcut = macShortcut( META );
			expect( shortcut ).toEqual( '⌃control' );
		} );

		it( 'should output Shift unicode for SHIFT key', () => {
			const shortcut = macShortcut( SHIFT );
			expect( shortcut ).toEqual( '⇧shift' );
		} );

		it( 'should strip + between command and single ending character', () => {
			const simpleShortcut = macShortcut( `${ PRIMARY }+B` );
			expect( simpleShortcut ).toEqual( '⌘B' );

			const modifiedShortcut = macShortcut( `${ ALT }+${ PRIMARY }+B` );
			expect( modifiedShortcut ).toEqual( '⌥option+⌘B' );
		} );

		it( 'should not strip + between command and other character', () => {
			const shortcut = macShortcut( `${ PRIMARY }+Space` );
			expect( shortcut ).toEqual( '⌘+Space' );
		} );
	} );
} );

describe( 'accessShortcut', () => {
	it( 'should uppercase character', () => {
		const shortcut = accessShortcut( 'm', isMacOSFalse );
		expect( shortcut ).toEqual( 'Shift+Alt+M' );
	} );

	it( 'should output Shift+Alt text on Windows', () => {
		const shortcut = accessShortcut( 'M', isMacOSFalse );
		expect( shortcut ).toEqual( 'Shift+Alt+M' );
	} );

	it( 'should output control+option symbols on MacOS', () => {
		const shortcut = accessShortcut( 'M', isMacOSTrue );
		expect( shortcut ).toEqual( '⌃control+⌥option+M' );
	} );
} );

describe( 'accessKeyCode', () => {
	it( 'outputs the correct keycode on MacOS', () => {
		expect( accessKeyCode( 'm', isMacOSTrue ) ).toEqual( 'meta+alt+m' );
	} );

	it( 'outputs the correct keycode on Windows', () => {
		expect( accessKeyCode( 'm', isMacOSFalse ) ).toEqual( 'shift+alt+m' );
	} );
} );

describe( 'primaryShortcut', () => {
	it( 'should uppercase character', () => {
		const shortcut = primaryShortcut( 'm', isMacOSFalse );
		expect( shortcut ).toEqual( 'Ctrl+M' );
	} );

	it( 'should output Control text on Windows', () => {
		const shortcut = primaryShortcut( 'M', isMacOSFalse );
		expect( shortcut ).toEqual( 'Ctrl+M' );
	} );

	it( 'should output control symbol on MacOS', () => {
		const shortcut = primaryShortcut( 'M', isMacOSTrue );
		expect( shortcut ).toEqual( '⌘M' );
	} );
} );

describe( 'secondaryShortcut', () => {
	it( 'should uppercase character', () => {
		const shortcut = secondaryShortcut( 'm', isMacOSFalse );
		expect( shortcut ).toEqual( 'Ctrl+Shift+Alt+M' );
	} );

	it( 'should output Shift+Alt text on Windows', () => {
		const shortcut = secondaryShortcut( 'M', isMacOSFalse );
		expect( shortcut ).toEqual( 'Ctrl+Shift+Alt+M' );
	} );

	it( 'should output control+option symbols on MacOS', () => {
		const shortcut = secondaryShortcut( 'M', isMacOSTrue );
		expect( shortcut ).toEqual( '⇧shift+⌥option+⌘M' );
	} );
} );

describe( 'secondaryKeyCode', () => {
	it( 'outputs the correct keycode on MacOS', () => {
		expect( secondaryKeyCode( 'm', isMacOSTrue ) ).toEqual( 'shift+alt+mod+m' );
	} );

	it( 'outputs the correct keycode on Windows', () => {
		expect( secondaryKeyCode( 'm', isMacOSFalse ) ).toEqual( 'mod+shift+alt+m' );
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
