/**
 * Internal dependencies
 */
import {
	displayShortcutList,
	displayShortcut,
	rawShortcut,
	shortcutAriaLabel,
	isKeyboardEvent,
} from '../';

const isAppleOSFalse = () => false;
const isAppleOSTrue = () => true;

describe( 'displayShortcutList', () => {
	describe( 'primary', () => {
		it( 'should output [ Ctrl, +, M ] on Windows', () => {
			const shortcut = displayShortcutList.primary( 'm', isAppleOSFalse );
			expect( shortcut ).toEqual( [ 'Ctrl', '+', 'M' ] );
		} );

		it( 'should output [ ⌘, M ] on MacOS', () => {
			const shortcut = displayShortcutList.primary( 'm', isAppleOSTrue );
			expect( shortcut ).toEqual( [ '⌘', 'M' ] );
		} );

		it( 'outputs [ ⌘, Del ] on MacOS (works for multiple character keys)', () => {
			const shortcut = displayShortcutList.primary(
				'del',
				isAppleOSTrue
			);
			expect( shortcut ).toEqual( [ '⌘', 'Del' ] );
		} );
	} );

	describe( 'primaryShift', () => {
		it( 'should output [ Ctrl, +, Shift, +, M ] on Windows', () => {
			const shortcut = displayShortcutList.primaryShift(
				'm',
				isAppleOSFalse
			);
			expect( shortcut ).toEqual( [ 'Ctrl', '+', 'Shift', '+', 'M' ] );
		} );

		it( 'should output [ ⇧, ⌘, M ] on MacOS', () => {
			const shortcut = displayShortcutList.primaryShift(
				'm',
				isAppleOSTrue
			);
			expect( shortcut ).toEqual( [ '⇧', '⌘', 'M' ] );
		} );

		it( 'outputs [ ⇧, ⌘, Del ] on MacOS (works for multiple character keys)', () => {
			const shortcut = displayShortcutList.primaryShift(
				'del',
				isAppleOSTrue
			);
			expect( shortcut ).toEqual( [ '⇧', '⌘', 'Del' ] );
		} );
	} );

	describe( 'secondary', () => {
		it( 'should output [ Ctrl, +, Shift, +, Alt ] text on Windows', () => {
			const shortcut = displayShortcutList.secondary(
				'm',
				isAppleOSFalse
			);
			expect( shortcut ).toEqual( [
				'Ctrl',
				'+',
				'Shift',
				'+',
				'Alt',
				'+',
				'M',
			] );
		} );

		it( 'should output [ ⇧, ⌥, ⌘, M ] on MacOS', () => {
			const shortcut = displayShortcutList.secondary(
				'm',
				isAppleOSTrue
			);
			expect( shortcut ).toEqual( [ '⇧', '⌥', '⌘', 'M' ] );
		} );
	} );

	describe( 'access', () => {
		it( 'should output [ Shift, +, Alt, +, M ] on Windows', () => {
			const shortcut = displayShortcutList.access( 'm', isAppleOSFalse );
			expect( shortcut ).toEqual( [ 'Shift', '+', 'Alt', '+', 'M' ] );
		} );

		it( 'should output [⌃, ⌥, M ] on MacOS', () => {
			const shortcut = displayShortcutList.access( 'm', isAppleOSTrue );
			expect( shortcut ).toEqual( [ '⌃', '⌥', 'M' ] );
		} );
	} );
} );

describe( 'displayShortcut', () => {
	describe( 'primary', () => {
		it( 'should output Control text on Windows', () => {
			const shortcut = displayShortcut.primary( 'm', isAppleOSFalse );
			expect( shortcut ).toEqual( 'Ctrl+M' );
		} );

		it( 'should output command symbol on MacOS', () => {
			const shortcut = displayShortcut.primary( 'm', isAppleOSTrue );
			expect( shortcut ).toEqual( '⌘M' );
		} );

		it( 'outputs command Del on MacOS (works for multiple character keys)', () => {
			const shortcut = displayShortcut.primary( 'del', isAppleOSTrue );
			expect( shortcut ).toEqual( '⌘Del' );
		} );
	} );

	describe( 'primaryShift', () => {
		it( 'should output Ctrl+Shift text on Windows', () => {
			const shortcut = displayShortcut.primaryShift(
				'm',
				isAppleOSFalse
			);
			expect( shortcut ).toEqual( 'Ctrl+Shift+M' );
		} );

		it( 'should output shift+command symbols on MacOS', () => {
			const shortcut = displayShortcut.primaryShift( 'm', isAppleOSTrue );
			expect( shortcut ).toEqual( '⇧⌘M' );
		} );

		it( 'outputs ⇧⌘Del on MacOS (works for multiple character keys)', () => {
			const shortcut = displayShortcut.primaryShift(
				'del',
				isAppleOSTrue
			);
			expect( shortcut ).toEqual( '⇧⌘Del' );
		} );
	} );

	describe( 'secondary', () => {
		it( 'should output Ctrl+Shift+Alt text on Windows', () => {
			const shortcut = displayShortcut.secondary( 'm', isAppleOSFalse );
			expect( shortcut ).toEqual( 'Ctrl+Shift+Alt+M' );
		} );

		it( 'should output ⇧+option+command symbols on MacOS', () => {
			const shortcut = displayShortcut.secondary( 'm', isAppleOSTrue );
			expect( shortcut ).toEqual( '⇧⌥⌘M' );
		} );
	} );

	describe( 'access', () => {
		it( 'should output Shift+Alt text on Windows', () => {
			const shortcut = displayShortcut.access( 'm', isAppleOSFalse );
			expect( shortcut ).toEqual( 'Shift+Alt+M' );
		} );

		it( 'should output control+option symbols on MacOS', () => {
			const shortcut = displayShortcut.access( 'm', isAppleOSTrue );
			expect( shortcut ).toEqual( '⌃⌥M' );
		} );
	} );
} );

describe( 'shortcutAriaLabel', () => {
	describe( 'primary', () => {
		it( 'should output "Control + Period" on Windows', () => {
			const shortcut = shortcutAriaLabel.primary( '.', isAppleOSFalse );
			expect( shortcut ).toEqual( 'Control + Period' );
		} );

		it( 'should output "Command Period" on Windows', () => {
			const shortcut = shortcutAriaLabel.primary( '.', isAppleOSTrue );
			expect( shortcut ).toEqual( 'Command Period' );
		} );
	} );

	describe( 'primaryShift', () => {
		it( 'should output "Control + Shift + Period" on Windows', () => {
			const shortcut = shortcutAriaLabel.primaryShift(
				'.',
				isAppleOSFalse
			);
			expect( shortcut ).toEqual( 'Control + Shift + Period' );
		} );

		it( 'should output "Shift Command Period" on MacOS', () => {
			const shortcut = shortcutAriaLabel.primaryShift(
				'.',
				isAppleOSTrue
			);
			expect( shortcut ).toEqual( 'Shift Command Period' );
		} );
	} );

	describe( 'secondary', () => {
		it( 'should output "Control + Shift + Alt + Period" on Windows', () => {
			const shortcut = shortcutAriaLabel.secondary( '.', isAppleOSFalse );
			expect( shortcut ).toEqual( 'Control + Shift + Alt + Period' );
		} );

		it( 'should output "Shift Option Command Period" on MacOS', () => {
			const shortcut = shortcutAriaLabel.secondary( '.', isAppleOSTrue );
			expect( shortcut ).toEqual( 'Shift Option Command Period' );
		} );
	} );

	describe( 'access', () => {
		it( 'should output "Shift + Alt + Period" on Windows', () => {
			const shortcut = shortcutAriaLabel.access( '.', isAppleOSFalse );
			expect( shortcut ).toEqual( 'Shift + Alt + Period' );
		} );

		it( 'should output "Control Option Period" on MacOS', () => {
			const shortcut = shortcutAriaLabel.access( '.', isAppleOSTrue );
			expect( shortcut ).toEqual( 'Control Option Period' );
		} );
	} );
} );

describe( 'rawShortcut', () => {
	describe( 'primary', () => {
		it( 'should output ctrl on Windows', () => {
			const shortcut = rawShortcut.primary( 'm', isAppleOSFalse );
			expect( shortcut ).toEqual( 'ctrl+m' );
		} );

		it( 'should output meta on MacOS', () => {
			const shortcut = rawShortcut.primary( 'm', isAppleOSTrue );
			expect( shortcut ).toEqual( 'meta+m' );
		} );
	} );

	describe( 'primaryShift', () => {
		it( 'should output ctrl+shift on Windows', () => {
			const shortcut = rawShortcut.primaryShift( 'm', isAppleOSFalse );
			expect( shortcut ).toEqual( 'ctrl+shift+m' );
		} );

		it( 'should output shift+meta on MacOS', () => {
			const shortcut = rawShortcut.primaryShift( 'm', isAppleOSTrue );
			expect( shortcut ).toEqual( 'shift+meta+m' );
		} );
	} );

	describe( 'secondary', () => {
		it( 'should output ctrl+shift+alt on Windows', () => {
			const shortcut = rawShortcut.secondary( 'm', isAppleOSFalse );
			expect( shortcut ).toEqual( 'ctrl+shift+alt+m' );
		} );

		it( 'should output shift+alt+meta on MacOS', () => {
			const shortcut = rawShortcut.secondary( 'm', isAppleOSTrue );
			expect( shortcut ).toEqual( 'shift+alt+meta+m' );
		} );
	} );

	describe( 'access', () => {
		it( 'should output shift+alt on Windows', () => {
			const shortcut = rawShortcut.access( 'm', isAppleOSFalse );
			expect( shortcut ).toEqual( 'shift+alt+m' );
		} );

		it( 'should output ctrl+alt on MacOS', () => {
			const shortcut = rawShortcut.access( 'm', isAppleOSTrue );
			expect( shortcut ).toEqual( 'ctrl+alt+m' );
		} );
	} );
} );

describe( 'isKeyboardEvent', () => {
	afterEach( () => {
		while ( document.body.firstChild ) {
			document.body.removeChild( document.body.firstChild );
		}
	} );

	function keyPress( target, modifiers ) {
		[ 'keydown', 'keypress', 'keyup' ].forEach( ( eventName ) => {
			const event = new window.KeyboardEvent( eventName, {
				...modifiers,
				bubbles: true,
				keyCode: modifiers.key.charCodeAt( 0 ),
			} );
			target.dispatchEvent( event );
		} );
	}

	function attachEventListeners( eventHandler ) {
		const attachNode = document.createElement( 'div' );
		document.body.appendChild( attachNode );

		[ 'keydown', 'keypress', 'keyup' ].forEach( ( eventName ) => {
			attachNode.addEventListener( eventName, eventHandler );
		} );

		return attachNode;
	}

	it( 'returns false for a superset of modifiers', () => {
		expect.assertions( 3 );
		const attachNode = attachEventListeners( ( event ) => {
			expect(
				isKeyboardEvent.primary( event, 'm', isAppleOSFalse )
			).toBe( false );
		} );

		keyPress( attachNode, {
			ctrlKey: true,
			shiftKey: true,
			key: 'm',
		} );
	} );

	describe( 'primary', () => {
		it( 'should identify modifier key when Ctrl is pressed', () => {
			expect.assertions( 3 );
			const attachNode = attachEventListeners( ( event ) => {
				expect(
					isKeyboardEvent.primary( event, undefined, isAppleOSFalse )
				).toBe( true );
			} );

			keyPress( attachNode, {
				ctrlKey: true,
				key: 'Ctrl',
			} );
		} );

		it( 'should identify modifier key when ⌘ is pressed', () => {
			expect.assertions( 3 );
			const attachNode = attachEventListeners( ( event ) => {
				expect(
					isKeyboardEvent.primary( event, undefined, isAppleOSTrue )
				).toBe( true );
			} );

			keyPress( attachNode, {
				metaKey: true,
				key: 'Meta',
			} );
		} );

		it( 'should identify modifier key when Ctrl + M is pressed', () => {
			expect.assertions( 3 );
			const attachNode = attachEventListeners( ( event ) => {
				expect(
					isKeyboardEvent.primary( event, 'm', isAppleOSFalse )
				).toBe( true );
			} );

			keyPress( attachNode, {
				ctrlKey: true,
				key: 'm',
			} );
		} );

		it( 'should identify modifier key when ⌘M is pressed', () => {
			expect.assertions( 3 );
			const attachNode = attachEventListeners( ( event ) => {
				expect(
					isKeyboardEvent.primary( event, 'm', isAppleOSTrue )
				).toBe( true );
			} );

			keyPress( attachNode, {
				metaKey: true,
				key: 'm',
			} );
		} );
	} );

	describe( 'primaryShift', () => {
		it( 'should identify modifier key when Shift + Ctrl is pressed', () => {
			expect.assertions( 3 );
			const attachNode = attachEventListeners( ( event ) => {
				expect(
					isKeyboardEvent.primaryShift(
						event,
						undefined,
						isAppleOSFalse
					)
				).toBe( true );
			} );

			keyPress( attachNode, {
				ctrlKey: true,
				shiftKey: true,
				key: 'Ctrl',
			} );
		} );

		it( 'should identify modifier key when ⇧⌘ is pressed', () => {
			expect.assertions( 3 );
			const attachNode = attachEventListeners( ( event ) => {
				expect(
					isKeyboardEvent.primaryShift(
						event,
						undefined,
						isAppleOSTrue
					)
				).toBe( true );
			} );

			keyPress( attachNode, {
				metaKey: true,
				shiftKey: true,
				key: 'Meta',
			} );
		} );

		it( 'should identify modifier key when Shift + Ctrl + M is pressed', () => {
			expect.assertions( 3 );
			const attachNode = attachEventListeners( ( event ) => {
				expect(
					isKeyboardEvent.primaryShift( event, 'm', isAppleOSFalse )
				).toBe( true );
			} );

			keyPress( attachNode, {
				ctrlKey: true,
				shiftKey: true,
				key: 'm',
			} );
		} );

		it( 'should identify modifier key when ⇧⌘M is pressed', () => {
			expect.assertions( 3 );
			const attachNode = attachEventListeners( ( event ) => {
				expect(
					isKeyboardEvent.primaryShift( event, 'm', isAppleOSTrue )
				).toBe( true );
			} );

			keyPress( attachNode, {
				metaKey: true,
				shiftKey: true,
				key: 'm',
			} );
		} );
	} );

	describe( 'secondary', () => {
		it( 'should identify modifier key when Shift + Alt + Ctrl is pressed', () => {
			expect.assertions( 3 );
			const attachNode = attachEventListeners( ( event ) => {
				expect(
					isKeyboardEvent.secondary(
						event,
						undefined,
						isAppleOSFalse
					)
				).toBe( true );
			} );

			keyPress( attachNode, {
				ctrlKey: true,
				shiftKey: true,
				altKey: true,
				key: 'Ctrl',
			} );
		} );

		it( 'should identify modifier key when ⇧⌥⌘ is pressed', () => {
			expect.assertions( 3 );
			const attachNode = attachEventListeners( ( event ) => {
				expect(
					isKeyboardEvent.secondary( event, undefined, isAppleOSTrue )
				).toBe( true );
			} );

			keyPress( attachNode, {
				metaKey: true,
				shiftKey: true,
				altKey: true,
				key: 'Meta',
			} );
		} );

		it( 'should identify modifier key when Shift + Ctrl + ALt + M is pressed', () => {
			expect.assertions( 3 );
			const attachNode = attachEventListeners( ( event ) => {
				expect(
					isKeyboardEvent.secondary( event, 'm', isAppleOSFalse )
				).toBe( true );
			} );

			keyPress( attachNode, {
				ctrlKey: true,
				shiftKey: true,
				altKey: true,
				key: 'm',
			} );
		} );

		it( 'should identify modifier key when ⇧⌥⌘M is pressed', () => {
			expect.assertions( 3 );
			const attachNode = attachEventListeners( ( event ) => {
				expect(
					isKeyboardEvent.secondary( event, 'm', isAppleOSTrue )
				).toBe( true );
			} );

			keyPress( attachNode, {
				metaKey: true,
				shiftKey: true,
				altKey: true,
				key: 'm',
			} );
		} );
	} );

	describe( 'access', () => {
		it( 'should identify modifier key when Shift + Alt is pressed', () => {
			expect.assertions( 3 );
			const attachNode = attachEventListeners( ( event ) => {
				expect(
					isKeyboardEvent.access( event, undefined, isAppleOSFalse )
				).toBe( true );
			} );

			keyPress( attachNode, {
				shiftKey: true,
				altKey: true,
				key: 'Alt',
			} );
		} );

		it( 'should identify modifier key when Ctrl + ⌥ is pressed', () => {
			expect.assertions( 3 );
			const attachNode = attachEventListeners( ( event ) => {
				expect(
					isKeyboardEvent.access( event, undefined, isAppleOSTrue )
				).toBe( true );
			} );

			keyPress( attachNode, {
				ctrlKey: true,
				altKey: true,
				key: 'Alt',
			} );
		} );

		it( 'should identify modifier key when Shift + Alt + M is pressed', () => {
			expect.assertions( 3 );
			const attachNode = attachEventListeners( ( event ) => {
				expect(
					isKeyboardEvent.access( event, 'm', isAppleOSFalse )
				).toBe( true );
			} );

			keyPress( attachNode, {
				shiftKey: true,
				altKey: true,
				key: 'm',
			} );
		} );

		it( 'should identify modifier key when Ctrl + ⌥M is pressed', () => {
			expect.assertions( 3 );
			const attachNode = attachEventListeners( ( event ) => {
				expect(
					isKeyboardEvent.access( event, 'm', isAppleOSTrue )
				).toBe( true );
			} );

			keyPress( attachNode, {
				ctrlKey: true,
				altKey: true,
				key: 'm',
			} );
		} );
	} );
} );
