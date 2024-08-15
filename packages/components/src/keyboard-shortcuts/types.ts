/**
 * WordPress dependencies
 */
import type { useKeyboardShortcut } from '@wordpress/compose';

// TODO: We wouldn't have to do this if this type was exported from `@wordpress/compose`.
type WPKeyboardShortcutConfig = NonNullable<
	Parameters< typeof useKeyboardShortcut >[ 2 ]
>;

export type KeyboardShortcutProps = {
	shortcut: string | string[];
	/**
	 * @see {@link https://craig.is/killing/mice Mousetrap documentation}
	 */
	callback: ( event: Mousetrap.ExtendedKeyboardEvent, combo: string ) => void;
} & Pick< WPKeyboardShortcutConfig, 'bindGlobal' | 'eventName' | 'target' >;

export type KeyboardShortcutsProps = {
	/**
	 * Elements to render, upon whom key events are to be monitored.
	 */
	children?: React.ReactNode;
	/**
	 * An object of shortcut bindings, where each key is a keyboard combination,
	 * the value of which is the callback to be invoked when the key combination is pressed.
	 *
	 * The value of each shortcut should be a consistent function reference, not an anonymous function.
	 * Otherwise, the callback will not be correctly unbound when the component unmounts.
	 *
	 * The `KeyboardShortcuts` component will not update to reflect a changed `shortcuts` prop.
	 * If you need to change shortcuts, mount a separate `KeyboardShortcuts` element,
	 * which can be achieved by assigning a unique `key` prop.
	 *
	 * @see {@link https://craig.is/killing/mice Mousetrap documentation}
	 */
	shortcuts: Record< string, KeyboardShortcutProps[ 'callback' ] >;
	/**
	 * By default, a callback will not be invoked if the key combination occurs in an editable field.
	 * Pass `bindGlobal` as `true` if the key events should be observed globally, including within editable fields.
	 *
	 * Tip: If you need some but not all keyboard events to be observed globally,
	 * simply render two distinct `KeyboardShortcuts` elements, one with and one without the `bindGlobal` prop.
	 */
	bindGlobal?: KeyboardShortcutProps[ 'bindGlobal' ];
	/**
	 * By default, a callback is invoked in response to the `keydown` event.
	 * To override this, pass `eventName` with the name of a specific keyboard event.
	 */
	eventName?: KeyboardShortcutProps[ 'eventName' ];
};
