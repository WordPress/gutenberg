/**
 * Internal dependencies
 */
import type { ShortcutProps } from '../shortcut/types';
import type { ButtonAsButtonProps } from '../button/types';

export type MenuItemsChoiceProps = {
	/**
	 * Array of choices.
	 *
	 * @default []
	 */
	choices: readonly MenuItemChoice[];
	/**
	 * Value of currently selected choice (should match a `value` property
	 * from a choice in `choices`).
	 */
	value: string;
	/**
	 * Callback function to be called with the selected choice when user
	 * selects a new choice.
	 */
	onSelect: ( value: string ) => void;

	/**
	 * Callback function to be called with a choice when user
	 * hovers over a new choice (will be empty on mouse leave).
	 *
	 * @default noop
	 */
	onHover: ( value: string | null ) => void;
};

export type MenuItemChoice = {
	/**
	 * Human-readable label for choice.
	 */
	label: string;
	/**
	 * Unique value for choice.
	 */
	value: string;
	/**
	 * Whether the menu item is disabled.
	 */
	disabled?: ButtonAsButtonProps[ 'disabled' ];
	/**
	 * Additional information which will be rendered below the given label.
	 */
	info?: string;
	/**
	 * Optional keyboard sequence to trigger choice with keyboard shortcut
	 * (e.g. `ctrl+s`).
	 */
	shortcut?: ShortcutProps[ 'shortcut' ];
	/**
	 * Aria compliant label.
	 */
	[ 'aria-label' ]?: string;
};
