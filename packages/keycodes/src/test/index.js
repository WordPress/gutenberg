/**
 * Internal dependencies
 */
import {
	isMacOS,
	displayShortcutList,
	displayShortcut,
	rawShortcut,
} from '../';

const isMacOSFalse = () => false;
const isMacOSTrue = () => true;

describe( 'displayShortcutList', () => {
	describe( 'primary', () => {
		it( 'should output [ Ctrl, +, M ] on Windows', () => {
			const shortcut = displayShortcutList.primary( 'm', isMacOSFalse );
			expect( shortcut ).toEqual( [ 'Ctrl', '+', 'M' ] );
		} );

		it( 'should output [ ⌘, M ] on MacOS', () => {
			const shortcut = displayShortcutList.primary( 'm', isMacOSTrue );
			expect( shortcut ).toEqual( [ '⌘', 'M' ] );
		} );

		it( 'outputs [ ⌘, Del ] on MacOS (works for multiple character keys)', () => {
			const shortcut = displayShortcutList.primary( 'del', isMacOSTrue );
			expect( shortcut ).toEqual( [ '⌘', 'Del' ] );
		} );
	} );

	describe( 'primaryShift', () => {
		it( 'should output [ Ctrl, +, Shift, +, M ] on Windows', () => {
			const shortcut = displayShortcutList.primaryShift( 'm', isMacOSFalse );
			expect( shortcut ).toEqual( [ 'Ctrl', '+', 'Shift', '+', 'M' ] );
		} );

		it( 'should output [ Shift, +, ⌘, M ] on MacOS', () => {
			const shortcut = displayShortcutList.primaryShift( 'm', isMacOSTrue );
			expect( shortcut ).toEqual( [ 'Shift', '+', '⌘', 'M' ] );
		} );

		it( 'outputs [ Shift, +, ⌘, Del ] on MacOS (works for multiple character keys)', () => {
			const shortcut = displayShortcutList.primaryShift( 'del', isMacOSTrue );
			expect( shortcut ).toEqual( [ 'Shift', '+', '⌘', 'Del' ] );
		} );
	} );

	describe( 'secondary', () => {
		it( 'should output [ Ctrl, +, Shift, +, Alt ] text on Windows', () => {
			const shortcut = displayShortcutList.secondary( 'm', isMacOSFalse );
			expect( shortcut ).toEqual( [ 'Ctrl', '+', 'Shift', '+', 'Alt', '+', 'M' ] );
		} );

		it( 'should output [ Shift, +, Option, +, Command, M ] on MacOS', () => {
			const shortcut = displayShortcutList.secondary( 'm', isMacOSTrue );
			expect( shortcut ).toEqual( [ 'Shift', '+', 'Option', '+', '⌘', 'M' ] );
		} );
	} );

	describe( 'access', () => {
		it( 'should output [ Shift, +, Alt, +, M ] on Windows', () => {
			const shortcut = displayShortcutList.access( 'm', isMacOSFalse );
			expect( shortcut ).toEqual( [ 'Shift', '+', 'Alt', '+', 'M' ] );
		} );

		it( 'should output [Ctrl, +, Option, +, M ] on MacOS', () => {
			const shortcut = displayShortcutList.access( 'm', isMacOSTrue );
			expect( shortcut ).toEqual( [ 'Ctrl', '+', 'Option', '+', 'M' ] );
		} );
	} );
} );

describe( 'displayShortcut', () => {
	describe( 'primary', () => {
		it( 'should output Control text on Windows', () => {
			const shortcut = displayShortcut.primary( 'm', isMacOSFalse );
			expect( shortcut ).toEqual( 'Ctrl+M' );
		} );

		it( 'should output command symbol on MacOS', () => {
			const shortcut = displayShortcut.primary( 'm', isMacOSTrue );
			expect( shortcut ).toEqual( '⌘M' );
		} );

		it( 'outputs command Del on MacOS (works for multiple character keys)', () => {
			const shortcut = displayShortcut.primary( 'del', isMacOSTrue );
			expect( shortcut ).toEqual( '⌘Del' );
		} );
	} );

	describe( 'primaryShift', () => {
		it( 'should output Ctrl+Shift text on Windows', () => {
			const shortcut = displayShortcut.primaryShift( 'm', isMacOSFalse );
			expect( shortcut ).toEqual( 'Ctrl+Shift+M' );
		} );

		it( 'should output shift+command symbols on MacOS', () => {
			const shortcut = displayShortcut.primaryShift( 'm', isMacOSTrue );
			expect( shortcut ).toEqual( 'Shift+⌘M' );
		} );

		it( 'outputs shift+command Del on MacOS (works for multiple character keys)', () => {
			const shortcut = displayShortcut.primaryShift( 'del', isMacOSTrue );
			expect( shortcut ).toEqual( 'Shift+⌘Del' );
		} );
	} );

	describe( 'secondary', () => {
		it( 'should output Ctrl+Shift+Alt text on Windows', () => {
			const shortcut = displayShortcut.secondary( 'm', isMacOSFalse );
			expect( shortcut ).toEqual( 'Ctrl+Shift+Alt+M' );
		} );

		it( 'should output shift+option+command symbols on MacOS', () => {
			const shortcut = displayShortcut.secondary( 'm', isMacOSTrue );
			expect( shortcut ).toEqual( 'Shift+Option+⌘M' );
		} );
	} );

	describe( 'access', () => {
		it( 'should output Shift+Alt text on Windows', () => {
			const shortcut = displayShortcut.access( 'm', isMacOSFalse );
			expect( shortcut ).toEqual( 'Shift+Alt+M' );
		} );

		it( 'should output control+option symbols on MacOS', () => {
			const shortcut = displayShortcut.access( 'm', isMacOSTrue );
			expect( shortcut ).toEqual( 'Ctrl+Option+M' );
		} );
	} );
} );

describe( 'rawShortcut', () => {
	describe( 'primary', () => {
		it( 'should output ctrl on Windows', () => {
			const shortcut = rawShortcut.primary( 'm', isMacOSFalse );
			expect( shortcut ).toEqual( 'ctrl+m' );
		} );

		it( 'should output meta on MacOS', () => {
			const shortcut = rawShortcut.primary( 'm', isMacOSTrue );
			expect( shortcut ).toEqual( 'meta+m' );
		} );
	} );

	describe( 'primaryShift', () => {
		it( 'should output ctrl+shift on Windows', () => {
			const shortcut = rawShortcut.primaryShift( 'm', isMacOSFalse );
			expect( shortcut ).toEqual( 'ctrl+shift+m' );
		} );

		it( 'should output shift+meta on MacOS', () => {
			const shortcut = rawShortcut.primaryShift( 'm', isMacOSTrue );
			expect( shortcut ).toEqual( 'shift+meta+m' );
		} );
	} );

	describe( 'secondary', () => {
		it( 'should output ctrl+shift+alt on Windows', () => {
			const shortcut = rawShortcut.secondary( 'm', isMacOSFalse );
			expect( shortcut ).toEqual( 'ctrl+shift+alt+m' );
		} );

		it( 'should output shift+alt+meta on MacOS', () => {
			const shortcut = rawShortcut.secondary( 'm', isMacOSTrue );
			expect( shortcut ).toEqual( 'shift+alt+meta+m' );
		} );
	} );

	describe( 'access', () => {
		it( 'should output shift+alt on Windows', () => {
			const shortcut = rawShortcut.access( 'm', isMacOSFalse );
			expect( shortcut ).toEqual( 'shift+alt+m' );
		} );

		it( 'should output ctrl+alt on MacOS', () => {
			const shortcut = rawShortcut.access( 'm', isMacOSTrue );
			expect( shortcut ).toEqual( 'ctrl+alt+m' );
		} );
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
