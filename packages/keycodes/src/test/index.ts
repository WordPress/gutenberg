/**
 * Internal dependencies
 */
import {
	displayShortcutList,
	displayShortcut,
	rawShortcut,
	ariaKeyShortcut,
	shortcutAriaLabel,
	shortcutFormats,
	isKeyboardEvent,
} from '..';

const isAppleOSFalse = (): boolean => false;
const isAppleOSTrue = (): boolean => true;

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

describe( 'ariaKeyShortcut', () => {
	describe( 'primary', () => {
		it( 'should output "Control+M" on Windows', () => {
			const shortcut = ariaKeyShortcut.primary( 'm', isAppleOSFalse );
			expect( shortcut ).toEqual( 'Control+M' );
		} );

		it( 'should output "Meta+M" on MacOS', () => {
			const shortcut = ariaKeyShortcut.primary( 'm', isAppleOSTrue );
			expect( shortcut ).toEqual( 'Meta+M' );
		} );

		it( 'should normalize "del" to "Delete"', () => {
			const shortcut = ariaKeyShortcut.primary( 'del', isAppleOSFalse );
			expect( shortcut ).toEqual( 'Control+Delete' );
		} );

		it( 'should normalize "esc" to "Escape"', () => {
			const shortcut = ariaKeyShortcut.primary( 'esc', isAppleOSFalse );
			expect( shortcut ).toEqual( 'Control+Escape' );
		} );
	} );

	describe( 'primaryShift', () => {
		it( 'should output "Control+Shift+M" on Windows', () => {
			const shortcut = ariaKeyShortcut.primaryShift(
				'm',
				isAppleOSFalse
			);
			expect( shortcut ).toEqual( 'Control+Shift+M' );
		} );

		it( 'should output "Shift+Meta+M" on MacOS', () => {
			const shortcut = ariaKeyShortcut.primaryShift( 'm', isAppleOSTrue );
			expect( shortcut ).toEqual( 'Shift+Meta+M' );
		} );
	} );

	describe( 'primaryAlt', () => {
		it( 'should output "Control+Alt+M" on Windows', () => {
			const shortcut = ariaKeyShortcut.primaryAlt( 'm', isAppleOSFalse );
			expect( shortcut ).toEqual( 'Control+Alt+M' );
		} );

		it( 'should output "AltGraph+Meta+M" on MacOS (Option key is AltGraph)', () => {
			const shortcut = ariaKeyShortcut.primaryAlt( 'm', isAppleOSTrue );
			expect( shortcut ).toEqual( 'AltGraph+Meta+M' );
		} );
	} );

	describe( 'secondary', () => {
		it( 'should output "Control+Shift+Alt+M" on Windows', () => {
			const shortcut = ariaKeyShortcut.secondary( 'm', isAppleOSFalse );
			expect( shortcut ).toEqual( 'Control+Shift+Alt+M' );
		} );

		it( 'should output "Shift+AltGraph+Meta+M" on MacOS (Option key is AltGraph)', () => {
			const shortcut = ariaKeyShortcut.secondary( 'm', isAppleOSTrue );
			expect( shortcut ).toEqual( 'Shift+AltGraph+Meta+M' );
		} );
	} );

	describe( 'access', () => {
		it( 'should output "Shift+Alt+M" on Windows', () => {
			const shortcut = ariaKeyShortcut.access( 'm', isAppleOSFalse );
			expect( shortcut ).toEqual( 'Shift+Alt+M' );
		} );

		it( 'should output "Control+AltGraph+M" on MacOS (Option key is AltGraph)', () => {
			const shortcut = ariaKeyShortcut.access( 'm', isAppleOSTrue );
			expect( shortcut ).toEqual( 'Control+AltGraph+M' );
		} );
	} );

	describe( 'alt', () => {
		it( 'should output "Alt+M" on Windows', () => {
			const shortcut = ariaKeyShortcut.alt( 'm', isAppleOSFalse );
			expect( shortcut ).toEqual( 'Alt+M' );
		} );

		it( 'should output "AltGraph+M" on MacOS (Option key is AltGraph)', () => {
			const shortcut = ariaKeyShortcut.alt( 'm', isAppleOSTrue );
			expect( shortcut ).toEqual( 'AltGraph+M' );
		} );
	} );

	describe( 'shiftAlt', () => {
		it( 'should output "Shift+Alt+M" on Windows', () => {
			const shortcut = ariaKeyShortcut.shiftAlt( 'm', isAppleOSFalse );
			expect( shortcut ).toEqual( 'Shift+Alt+M' );
		} );

		it( 'should output "Shift+AltGraph+M" on MacOS (Option key is AltGraph)', () => {
			const shortcut = ariaKeyShortcut.shiftAlt( 'm', isAppleOSTrue );
			expect( shortcut ).toEqual( 'Shift+AltGraph+M' );
		} );
	} );

	describe( 'special characters and key normalization', () => {
		it( 'should preserve special characters like period', () => {
			const shortcut = ariaKeyShortcut.primary( '.', isAppleOSFalse );
			expect( shortcut ).toEqual( 'Control+.' );
		} );

		it( 'should convert space to "Space"', () => {
			const shortcut = ariaKeyShortcut.primary( ' ', isAppleOSFalse );
			expect( shortcut ).toEqual( 'Control+Space' );
		} );

		it( 'should convert plus sign to "Plus"', () => {
			const shortcut = ariaKeyShortcut.primary( '+', isAppleOSFalse );
			expect( shortcut ).toEqual( 'Control+Plus' );
		} );
	} );

	describe( 'named key normalization', () => {
		it( 'should normalize "enter" to "Enter"', () => {
			const shortcut = ariaKeyShortcut.primary( 'enter', isAppleOSFalse );
			expect( shortcut ).toEqual( 'Control+Enter' );
		} );

		it( 'should normalize "tab" to "Tab"', () => {
			const shortcut = ariaKeyShortcut.primary( 'tab', isAppleOSFalse );
			expect( shortcut ).toEqual( 'Control+Tab' );
		} );

		it( 'should normalize arrow keys', () => {
			expect(
				ariaKeyShortcut.primary( 'arrowup', isAppleOSFalse )
			).toEqual( 'Control+ArrowUp' );
			expect(
				ariaKeyShortcut.primary( 'arrowdown', isAppleOSFalse )
			).toEqual( 'Control+ArrowDown' );
			expect(
				ariaKeyShortcut.primary( 'arrowleft', isAppleOSFalse )
			).toEqual( 'Control+ArrowLeft' );
			expect(
				ariaKeyShortcut.primary( 'arrowright', isAppleOSFalse )
			).toEqual( 'Control+ArrowRight' );
		} );

		it( 'should normalize navigation keys', () => {
			expect(
				ariaKeyShortcut.primary( 'pageup', isAppleOSFalse )
			).toEqual( 'Control+PageUp' );
			expect(
				ariaKeyShortcut.primary( 'pagedown', isAppleOSFalse )
			).toEqual( 'Control+PageDown' );
			expect( ariaKeyShortcut.primary( 'home', isAppleOSFalse ) ).toEqual(
				'Control+Home'
			);
			expect( ariaKeyShortcut.primary( 'end', isAppleOSFalse ) ).toEqual(
				'Control+End'
			);
		} );

		it( 'should normalize editing keys', () => {
			expect(
				ariaKeyShortcut.primary( 'backspace', isAppleOSFalse )
			).toEqual( 'Control+Backspace' );
			expect(
				ariaKeyShortcut.primary( 'insert', isAppleOSFalse )
			).toEqual( 'Control+Insert' );
		} );

		it( 'should normalize function keys', () => {
			expect( ariaKeyShortcut.undefined( 'f1', isAppleOSFalse ) ).toEqual(
				'F1'
			);
			expect(
				ariaKeyShortcut.undefined( 'f10', isAppleOSFalse )
			).toEqual( 'F10' );
			expect(
				ariaKeyShortcut.undefined( 'f12', isAppleOSFalse )
			).toEqual( 'F12' );
		} );
	} );

	describe( 'HTML entity escaping', () => {
		it( 'should escape double quote character', () => {
			const shortcut = ariaKeyShortcut.shift( '"', isAppleOSFalse );
			expect( shortcut ).toEqual( 'Shift+&quot;' );
		} );

		it( 'should escape single quote character', () => {
			const shortcut = ariaKeyShortcut.primary( "'", isAppleOSFalse );
			expect( shortcut ).toEqual( 'Control+&#39;' );
		} );

		it( 'should escape ampersand character', () => {
			const shortcut = ariaKeyShortcut.primary( '&', isAppleOSFalse );
			expect( shortcut ).toEqual( 'Control+&amp;' );
		} );

		it( 'should escape less-than character', () => {
			const shortcut = ariaKeyShortcut.primary( '<', isAppleOSFalse );
			expect( shortcut ).toEqual( 'Control+&lt;' );
		} );

		it( 'should escape greater-than character', () => {
			const shortcut = ariaKeyShortcut.primary( '>', isAppleOSFalse );
			expect( shortcut ).toEqual( 'Control+&gt;' );
		} );
	} );
} );

describe( 'shortcutFormats', () => {
	it( 'should return all three shortcut formats for primary modifier on Windows', () => {
		const result = shortcutFormats( 'primary', 'm' );

		expect( result ).toEqual( {
			shortcutAriaLabel: 'Control + M',
			displayShortcut: 'Ctrl+M',
			ariaKeyShortcut: 'Control+M',
		} );
	} );

	it( 'should return all three shortcut formats for primaryShift modifier', () => {
		const result = shortcutFormats( 'primaryShift', 'k' );

		expect( result ).toEqual( {
			shortcutAriaLabel: 'Control + Shift + K',
			displayShortcut: 'Ctrl+Shift+K',
			ariaKeyShortcut: 'Control+Shift+K',
		} );
	} );

	it( 'should return all three shortcut formats for access modifier', () => {
		const result = shortcutFormats( 'access', 'h' );

		expect( result ).toEqual( {
			shortcutAriaLabel: 'Shift + Alt + H',
			displayShortcut: 'Shift+Alt+H',
			ariaKeyShortcut: 'Shift+Alt+H',
		} );
	} );

	it( 'should handle special characters like period', () => {
		const result = shortcutFormats( 'primary', '.' );

		expect( result ).toEqual( {
			shortcutAriaLabel: 'Control + Period',
			displayShortcut: 'Ctrl+.',
			ariaKeyShortcut: 'Control+.',
		} );
	} );

	it( 'should return consistent results with individual functions', () => {
		const modifier = 'primary';
		const character = 'z';
		const result = shortcutFormats( modifier, character );

		expect( result.shortcutAriaLabel ).toEqual(
			shortcutAriaLabel[ modifier ]( character )
		);
		expect( result.displayShortcut ).toEqual(
			displayShortcut[ modifier ]( character )
		);
		expect( result.ariaKeyShortcut ).toEqual(
			ariaKeyShortcut[ modifier ]( character )
		);
	} );
} );

describe( 'isKeyboardEvent', () => {
	afterEach( () => {
		while ( document.body.firstChild ) {
			document.body.removeChild( document.body.firstChild );
		}
	} );

	function keyPress(
		target: HTMLElement,
		modifiers: Partial< KeyboardEventInit > & { key: string }
	) {
		[ 'keydown', 'keypress', 'keyup' ].forEach( ( eventName ) => {
			const event = new window.KeyboardEvent( eventName, {
				...modifiers,
				bubbles: true,
				keyCode: modifiers.key.charCodeAt( 0 ),
			} );
			target.dispatchEvent( event );
		} );
	}

	function attachEventListeners(
		eventHandler: ( event: KeyboardEvent ) => void
	): HTMLElement {
		const attachNode = document.createElement( 'div' ) as HTMLDivElement;
		document.body.appendChild( attachNode );

		const keyboardEvents: Array< 'keydown' | 'keypress' | 'keyup' > = [
			'keydown',
			'keypress',
			'keyup',
		];

		keyboardEvents.forEach( ( eventName ) => {
			attachNode.addEventListener( eventName, eventHandler );
		} );

		return attachNode;
	}

	it( 'returns false for a superset of modifiers', () => {
		expect.assertions( 3 );
		const attachNode = attachEventListeners( ( event: KeyboardEvent ) => {
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
			const attachNode = attachEventListeners(
				( event: KeyboardEvent ) => {
					expect(
						isKeyboardEvent.primary( event, '', isAppleOSFalse )
					).toBe( true );
				}
			);

			keyPress( attachNode, {
				ctrlKey: true,
				key: 'Ctrl',
			} );
		} );

		it( 'should identify modifier key when ⌘ is pressed', () => {
			expect.assertions( 3 );
			const attachNode = attachEventListeners(
				( event: KeyboardEvent ) => {
					expect(
						isKeyboardEvent.primary( event, '', isAppleOSTrue )
					).toBe( true );
				}
			);

			keyPress( attachNode, {
				metaKey: true,
				key: 'Meta',
			} );
		} );

		it( 'should identify modifier key when Ctrl + M is pressed', () => {
			expect.assertions( 3 );
			const attachNode = attachEventListeners(
				( event: KeyboardEvent ) => {
					expect(
						isKeyboardEvent.primary( event, 'm', isAppleOSFalse )
					).toBe( true );
				}
			);

			keyPress( attachNode, {
				ctrlKey: true,
				key: 'm',
			} );
		} );

		it( 'should identify modifier key when ⌘M is pressed', () => {
			expect.assertions( 3 );
			const attachNode = attachEventListeners(
				( event: KeyboardEvent ) => {
					expect(
						isKeyboardEvent.primary( event, 'm', isAppleOSTrue )
					).toBe( true );
				}
			);

			keyPress( attachNode, {
				metaKey: true,
				key: 'm',
			} );
		} );
	} );

	describe( 'primaryShift', () => {
		it( 'should identify modifier key when Shift + Ctrl is pressed', () => {
			expect.assertions( 3 );
			const attachNode = attachEventListeners(
				( event: KeyboardEvent ) => {
					expect(
						isKeyboardEvent.primaryShift(
							event,
							'',
							isAppleOSFalse
						)
					).toBe( true );
				}
			);

			keyPress( attachNode, {
				ctrlKey: true,
				shiftKey: true,
				key: 'Ctrl',
			} );
		} );

		it( 'should identify modifier key when ⇧⌘ is pressed', () => {
			expect.assertions( 3 );
			const attachNode = attachEventListeners(
				( event: KeyboardEvent ) => {
					expect(
						isKeyboardEvent.primaryShift( event, '', isAppleOSTrue )
					).toBe( true );
				}
			);

			keyPress( attachNode, {
				metaKey: true,
				shiftKey: true,
				key: 'Meta',
			} );
		} );

		it( 'should identify modifier key when Shift + Ctrl + M is pressed', () => {
			expect.assertions( 3 );
			const attachNode = attachEventListeners(
				( event: KeyboardEvent ) => {
					expect(
						isKeyboardEvent.primaryShift(
							event,
							'm',
							isAppleOSFalse
						)
					).toBe( true );
				}
			);

			keyPress( attachNode, {
				ctrlKey: true,
				shiftKey: true,
				key: 'm',
			} );
		} );

		it( 'should identify modifier key when ⇧⌘M is pressed', () => {
			expect.assertions( 3 );
			const attachNode = attachEventListeners(
				( event: KeyboardEvent ) => {
					expect(
						isKeyboardEvent.primaryShift(
							event,
							'm',
							isAppleOSTrue
						)
					).toBe( true );
				}
			);

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
			const attachNode = attachEventListeners(
				( event: KeyboardEvent ) => {
					expect(
						isKeyboardEvent.secondary( event, '', isAppleOSFalse )
					).toBe( true );
				}
			);

			keyPress( attachNode, {
				ctrlKey: true,
				shiftKey: true,
				altKey: true,
				key: 'Ctrl',
			} );
		} );

		it( 'should identify modifier key when ⇧⌥⌘ is pressed', () => {
			expect.assertions( 3 );
			const attachNode = attachEventListeners(
				( event: KeyboardEvent ) => {
					expect(
						isKeyboardEvent.secondary( event, '', isAppleOSTrue )
					).toBe( true );
				}
			);

			keyPress( attachNode, {
				metaKey: true,
				shiftKey: true,
				altKey: true,
				key: 'Meta',
			} );
		} );

		it( 'should identify modifier key when Shift + Ctrl + ALt + M is pressed', () => {
			expect.assertions( 3 );
			const attachNode = attachEventListeners(
				( event: KeyboardEvent ) => {
					expect(
						isKeyboardEvent.secondary( event, 'm', isAppleOSFalse )
					).toBe( true );
				}
			);

			keyPress( attachNode, {
				ctrlKey: true,
				shiftKey: true,
				altKey: true,
				key: 'm',
			} );
		} );

		it( 'should identify modifier key when ⇧⌥⌘M is pressed', () => {
			expect.assertions( 3 );
			const attachNode = attachEventListeners(
				( event: KeyboardEvent ) => {
					expect(
						isKeyboardEvent.secondary( event, 'm', isAppleOSTrue )
					).toBe( true );
				}
			);

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
			const attachNode = attachEventListeners(
				( event: KeyboardEvent ) => {
					expect(
						isKeyboardEvent.access( event, '', isAppleOSFalse )
					).toBe( true );
				}
			);

			keyPress( attachNode, {
				shiftKey: true,
				altKey: true,
				key: 'Alt',
			} );
		} );

		it( 'should identify modifier key when Ctrl + ⌥ is pressed', () => {
			expect.assertions( 3 );
			const attachNode = attachEventListeners(
				( event: KeyboardEvent ) => {
					expect(
						isKeyboardEvent.access( event, '', isAppleOSTrue )
					).toBe( true );
				}
			);

			keyPress( attachNode, {
				ctrlKey: true,
				altKey: true,
				key: 'Alt',
			} );
		} );

		it( 'should identify modifier key when Shift + Alt + M is pressed', () => {
			expect.assertions( 3 );
			const attachNode = attachEventListeners(
				( event: KeyboardEvent ) => {
					expect(
						isKeyboardEvent.access( event, 'm', isAppleOSFalse )
					).toBe( true );
				}
			);

			keyPress( attachNode, {
				shiftKey: true,
				altKey: true,
				key: 'm',
			} );
		} );

		it( 'should identify modifier key when Ctrl + ⌥M is pressed', () => {
			expect.assertions( 3 );
			const attachNode = attachEventListeners(
				( event: KeyboardEvent ) => {
					expect(
						isKeyboardEvent.access( event, 'm', isAppleOSTrue )
					).toBe( true );
				}
			);

			keyPress( attachNode, {
				ctrlKey: true,
				altKey: true,
				key: 'm',
			} );
		} );
	} );
} );
