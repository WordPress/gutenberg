/**
 * Internal dependencies
 */
import {
	isMacOS,
	displayShortcut,
} from '../keycodes';

const isMacOSFalse = () => false;
const isMacOSTrue = () => true;

describe( 'displayShortcut', () => {
	describe( 'primary', () => {
		it( 'should output Control text on Windows', () => {
			const shortcut = displayShortcut.primary( 'M', isMacOSFalse );
			expect( shortcut ).toEqual( 'Ctrl+M' );
		} );

		it( 'should output command symbol on MacOS', () => {
			const shortcut = displayShortcut.primary( 'M', isMacOSTrue );
			expect( shortcut ).toEqual( '⌘M' );
		} );
	} );

	describe( 'primaryShift', () => {
		it( 'should output Ctrl+Shift text on Windows', () => {
			const shortcut = displayShortcut.primaryShift( 'M', isMacOSFalse );
			expect( shortcut ).toEqual( 'Ctrl+Shift+M' );
		} );

		it( 'should output shift+command symbols on MacOS', () => {
			const shortcut = displayShortcut.primaryShift( 'M', isMacOSTrue );
			expect( shortcut ).toEqual( '⇧shift+⌘M' );
		} );
	} );

	describe( 'secondary', () => {
		it( 'should output Ctrl+Shift+Alt text on Windows', () => {
			const shortcut = displayShortcut.secondary( 'M', isMacOSFalse );
			expect( shortcut ).toEqual( 'Ctrl+Shift+Alt+M' );
		} );

		it( 'should output shift+option+command symbols on MacOS', () => {
			const shortcut = displayShortcut.secondary( 'M', isMacOSTrue );
			expect( shortcut ).toEqual( '⇧shift+⌥option+⌘M' );
		} );
	} );

	describe( 'access', () => {
		it( 'should output Shift+Alt text on Windows', () => {
			const shortcut = displayShortcut.access( 'm', isMacOSFalse );
			expect( shortcut ).toEqual( 'Shift+Alt+M' );
		} );

		it( 'should output control+option symbols on MacOS', () => {
			const shortcut = displayShortcut.access( 'M', isMacOSTrue );
			expect( shortcut ).toEqual( '⌃control+⌥option+M' );
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
