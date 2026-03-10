/**
 * Internal dependencies
 */
import {
	displayShortcutList,
	displayShortcut,
	rawShortcut,
	ariaKeyShortcut,
	shortcutAriaLabel,
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
	describe( 'modifier key formatting', () => {
		it( 'should use "Control" (not "ctrl") on Windows', () => {
			const shortcut = ariaKeyShortcut.primary( 'm', isAppleOSFalse );
			expect( shortcut ).toEqual( 'Control+M' );
		} );

		it( 'should use "Meta" for Command key on MacOS', () => {
			const shortcut = ariaKeyShortcut.primary( 'm', isAppleOSTrue );
			expect( shortcut ).toEqual( 'Meta+M' );
		} );

		it( 'should capitalize modifier keys (Shift, Alt)', () => {
			const shortcut = ariaKeyShortcut.secondary( 'm', isAppleOSFalse );
			expect( shortcut ).toEqual( 'Control+Shift+Alt+M' );
		} );

		it( 'should handle multiple modifiers on MacOS', () => {
			const shortcut = ariaKeyShortcut.secondary( 'm', isAppleOSTrue );
			expect( shortcut ).toEqual( 'Shift+Alt+Meta+M' );
		} );
	} );

	describe( 'character handling', () => {
		it( 'should uppercase single letter characters', () => {
			const shortcut = ariaKeyShortcut.primary( 'k', isAppleOSFalse );
			expect( shortcut ).toEqual( 'Control+K' );
		} );

		it( 'should pass through number characters', () => {
			const shortcut = ariaKeyShortcut.primary( '1', isAppleOSFalse );
			expect( shortcut ).toEqual( 'Control+1' );
		} );

		it( 'should capitalize multi-character key names', () => {
			const shortcut = ariaKeyShortcut.primary( 'enter', isAppleOSFalse );
			expect( shortcut ).toEqual( 'Control+Enter' );
		} );

		it( 'should pass through special characters unchanged', () => {
			const shortcut = ariaKeyShortcut.primary( '.', isAppleOSFalse );
			expect( shortcut ).toEqual( 'Control+.' );
		} );

		it( 'should output just the character when no modifier is used', () => {
			const shortcut = ariaKeyShortcut.undefined( 'F1', isAppleOSFalse );
			expect( shortcut ).toEqual( 'F1' );
		} );
	} );
} );

/**
 * Tests for handling KeyboardEvent.key-style values.
 *
 * These tests document how each shortcut function handles named keys
 * (like "Enter", "Tab", "Delete") as opposed to single character keys.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values
 */
describe( 'KeyboardEvent.key value handling', () => {
	const namedKeys = [
		// Whitespace keys
		'Tab',
		'Enter',
		'Space',
		// Navigation keys
		'ArrowUp',
		'ArrowDown',
		'ArrowLeft',
		'ArrowRight',
		'End',
		'Home',
		'PageDown',
		'PageUp',
		// Editing keys
		'Backspace',
		'Delete',
		'Insert',
		// UI keys
		'Escape',
		// Function keys
		'F1',
		'F10',
	];

	// Also test the lowercase/shorthand versions commonly used in the codebase
	const shorthandKeys = [ 'del', 'esc', 'enter', 'tab', 'space' ];

	describe( 'rawShortcut', () => {
		it( 'lowercases named keys', () => {
			expect( rawShortcut.primary( 'Enter', isAppleOSFalse ) ).toEqual(
				'ctrl+enter'
			);
			expect( rawShortcut.primary( 'Delete', isAppleOSFalse ) ).toEqual(
				'ctrl+delete'
			);
			expect( rawShortcut.primary( 'ArrowUp', isAppleOSFalse ) ).toEqual(
				'ctrl+arrowup'
			);
		} );

		it( 'passes through shorthand keys lowercased', () => {
			expect( rawShortcut.primary( 'del', isAppleOSFalse ) ).toEqual(
				'ctrl+del'
			);
			expect( rawShortcut.primary( 'esc', isAppleOSFalse ) ).toEqual(
				'ctrl+esc'
			);
		} );

		it.each( namedKeys )(
			'outputs %s lowercased with modifier',
			( key ) => {
				const shortcut = rawShortcut.primary( key, isAppleOSFalse );
				expect( shortcut ).toEqual( `ctrl+${ key.toLowerCase() }` );
			}
		);
	} );

	describe( 'displayShortcut', () => {
		it( 'capitalizes first letter of named keys', () => {
			expect(
				displayShortcut.primary( 'enter', isAppleOSFalse )
			).toEqual( 'Ctrl+Enter' );
			expect( displayShortcut.primary( 'del', isAppleOSFalse ) ).toEqual(
				'Ctrl+Del'
			);
			expect(
				displayShortcut.primary( 'arrowup', isAppleOSFalse )
			).toEqual( 'Ctrl+Arrowup' );
		} );

		it( 'preserves casing of already-capitalized keys', () => {
			expect(
				displayShortcut.primary( 'Enter', isAppleOSFalse )
			).toEqual( 'Ctrl+Enter' );
			expect(
				displayShortcut.primary( 'ArrowUp', isAppleOSFalse )
			).toEqual( 'Ctrl+ArrowUp' );
		} );

		it.each( namedKeys )(
			'outputs %s with capitalized first letter',
			( key ) => {
				const shortcut = displayShortcut.primary( key, isAppleOSFalse );
				// capitaliseFirstCharacter keeps the rest of the string as-is
				const expected = key.charAt( 0 ).toUpperCase() + key.slice( 1 );
				expect( shortcut ).toEqual( `Ctrl+${ expected }` );
			}
		);

		it.each( shorthandKeys )( 'capitalizes shorthand key %s', ( key ) => {
			const shortcut = displayShortcut.primary( key, isAppleOSFalse );
			const expected = key.charAt( 0 ).toUpperCase() + key.slice( 1 );
			expect( shortcut ).toEqual( `Ctrl+${ expected }` );
		} );
	} );

	describe( 'displayShortcutList', () => {
		it( 'capitalizes first letter of named keys in list', () => {
			expect(
				displayShortcutList.primary( 'enter', isAppleOSFalse )
			).toEqual( [ 'Ctrl', '+', 'Enter' ] );
			expect(
				displayShortcutList.primary( 'PageDown', isAppleOSFalse )
			).toEqual( [ 'Ctrl', '+', 'PageDown' ] );
		} );
	} );

	describe( 'shortcutAriaLabel', () => {
		it( 'capitalizes first letter of named keys', () => {
			expect(
				shortcutAriaLabel.primary( 'enter', isAppleOSFalse )
			).toEqual( 'Control + Enter' );
			expect(
				shortcutAriaLabel.primary( 'Delete', isAppleOSFalse )
			).toEqual( 'Control + Delete' );
		} );

		it( 'does not have special mappings for most named keys', () => {
			// Unlike period/comma which are mapped, named keys are just capitalized
			expect(
				shortcutAriaLabel.primary( 'ArrowUp', isAppleOSFalse )
			).toEqual( 'Control + ArrowUp' );
			expect(
				shortcutAriaLabel.primary( 'Escape', isAppleOSFalse )
			).toEqual( 'Control + Escape' );
		} );

		it.each( namedKeys )(
			'outputs %s with capitalized first letter',
			( key ) => {
				const shortcut = shortcutAriaLabel.primary(
					key,
					isAppleOSFalse
				);
				const expected = key.charAt( 0 ).toUpperCase() + key.slice( 1 );
				expect( shortcut ).toEqual( `Control + ${ expected }` );
			}
		);
	} );

	describe( 'ariaKeyShortcut', () => {
		it( 'capitalizes first letter of named keys', () => {
			expect(
				ariaKeyShortcut.primary( 'enter', isAppleOSFalse )
			).toEqual( 'Control+Enter' );
			expect(
				ariaKeyShortcut.primary( 'Delete', isAppleOSFalse )
			).toEqual( 'Control+Delete' );
		} );

		it( 'preserves casing after first character', () => {
			expect(
				ariaKeyShortcut.primary( 'ArrowUp', isAppleOSFalse )
			).toEqual( 'Control+ArrowUp' );
			expect(
				ariaKeyShortcut.primary( 'PageDown', isAppleOSFalse )
			).toEqual( 'Control+PageDown' );
		} );

		it.each( namedKeys )(
			'outputs %s with capitalized first letter',
			( key ) => {
				const shortcut = ariaKeyShortcut.primary( key, isAppleOSFalse );
				const expected = key.charAt( 0 ).toUpperCase() + key.slice( 1 );
				expect( shortcut ).toEqual( `Control+${ expected }` );
			}
		);

		it.each( shorthandKeys )( 'capitalizes shorthand key %s', ( key ) => {
			const shortcut = ariaKeyShortcut.primary( key, isAppleOSFalse );
			const expected = key.charAt( 0 ).toUpperCase() + key.slice( 1 );
			expect( shortcut ).toEqual( `Control+${ expected }` );
		} );
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
