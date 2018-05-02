/**
 * Internal dependencies
 */
import keyboardShortcut, {
	ALT,
	CONTROL,
	META,
	SHIFT,
} from '../keyboard-shortcut';

describe( 'keyboardShortcut', () => {
	// TODO: Make a generic version outside of Windows as a fallback so we
	// don't, for instance, show the Windows logo to Ubuntu users, etc.
	describe( 'Windows/Other Platforms', () => {
		const windowsWindow = { navigator: { platform: 'Windows' } };

		it( 'should output Ctrl for CONTROL key', () => {
			const shortcut = keyboardShortcut( windowsWindow, CONTROL );
			expect( shortcut ).toEqual( 'Ctrl' );
		} );

		it( 'should output Alt for ALT key', () => {
			const shortcut = keyboardShortcut( windowsWindow, ALT );
			expect( shortcut ).toEqual( 'Alt' );
		} );

		it( 'should output Windows Unicode for META key', () => {
			const shortcut = keyboardShortcut( windowsWindow, META );
			expect( shortcut ).toEqual( '⊞' );
		} );

		it( 'should output Shift for SHIFT key', () => {
			const shortcut = keyboardShortcut( windowsWindow, SHIFT );
			expect( shortcut ).toEqual( 'Shift' );
		} );

		it( 'should combine keys with "+" character', () => {
			const shortcut = keyboardShortcut( windowsWindow, CONTROL, ALT, 'B' );
			expect( shortcut ).toEqual( 'Ctrl+Alt+B' );
		} );
	} );

	describe( 'MacOS Platforms', () => {
		const macWindow = { navigator: { platform: 'MacOS' } };

		it( 'should output MacOS Clover for CONTROL key', () => {
			const shortcut = keyboardShortcut( macWindow, CONTROL );
			expect( shortcut ).toEqual( '⌘' );
		} );

		it( 'should output option symbol for ALT key', () => {
			const shortcut = keyboardShortcut( macWindow, ALT );
			expect( shortcut ).toEqual( '⌥' );
		} );

		it( 'should output control caret for META key', () => {
			const shortcut = keyboardShortcut( macWindow, META );
			expect( shortcut ).toEqual( '⌃' );
		} );

		it( 'should output Shift unicode for SHIFT key', () => {
			const shortcut = keyboardShortcut( macWindow, SHIFT );
			expect( shortcut ).toEqual( '⇧' );
		} );

		it( 'should combine keys with no character', () => {
			const shortcut = keyboardShortcut( macWindow, CONTROL, ALT, 'B' );
			expect( shortcut ).toEqual( '⌘⌥B' );
		} );
	} );
} );
