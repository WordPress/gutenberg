import type { AriaAttributes } from 'react';
import { forwardRef, useId } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { VisuallyHidden } from '../visually-hidden';

export type KeyboardShortcut = {
	/**
	 * The visual representation of the shortcut (e.g., "⌘S" on macOS or
	 * "Ctrl+S" on Windows).
	 */
	displayShortcut: string;

	/**
	 * The shortcut in a format compatible with the
	 * [aria-keyshortcuts](https://www.w3.org/TR/wai-aria-1.3/#aria-keyshortcuts)
	 * attribute. Use "+" to separate keys and standard key names
	 * (e.g., "Meta+S", "Control+Shift+P").
	 */
	ariaKeyShortcut: string;

	/**
	 * A plain-text label for the shortcut, used in its accessible description
	 * (e.g., "Command Shift S"). Generate this value with
	 * `shortcutAriaLabel` from `@wordpress/keycodes`.
	 */
	label: string;
};

type ShortcutAriaProps = Pick<
	AriaAttributes,
	'aria-describedby' | 'aria-keyshortcuts'
>;

/**
 * Returns shortcut accessibility metadata for an interactive element.
 *
 * Render `KeyboardShortcutDescription` with the returned `descriptionId` when
 * a shortcut is provided.
 */
function useKeyboardShortcutProps( {
	'aria-describedby': ariaDescribedBy,
	'aria-keyshortcuts': ariaKeyShortcuts,
	shortcut,
}: ShortcutAriaProps & { shortcut?: KeyboardShortcut } ) {
	const generatedDescriptionId = useId();
	const descriptionId = shortcut ? generatedDescriptionId : undefined;
	const describedBy = [ ariaDescribedBy, descriptionId ]
		.filter( Boolean )
		.join( ' ' );

	return {
		descriptionId,
		targetProps: {
			'aria-describedby': describedBy || undefined,
			'aria-keyshortcuts': shortcut?.ariaKeyShortcut ?? ariaKeyShortcuts,
		},
	};
}

/**
 * Renders a localized, visually hidden description for a keyboard shortcut.
 */
const KeyboardShortcutDescription = forwardRef<
	HTMLSpanElement,
	{
		descriptionId: string;
		shortcut: KeyboardShortcut;
	}
>( function KeyboardShortcutDescription( { descriptionId, shortcut }, ref ) {
	return (
		<VisuallyHidden
			id={ descriptionId }
			aria-hidden="true"
			render={ <span ref={ ref } /> }
		>
			{ sprintf(
				/* translators: %s: keyboard shortcut. */
				__( 'Keyboard shortcut: %s' ),
				shortcut.label ?? shortcut.ariaKeyShortcut
			) }
		</VisuallyHidden>
	);
} );

/**
 * Renders a visual keyboard shortcut while hiding it from assistive
 * technology.
 */
const KeyboardShortcutDisplay = forwardRef<
	HTMLSpanElement,
	{
		className?: string;
		shortcut: KeyboardShortcut;
	}
>( function KeyboardShortcutDisplay( { className, shortcut }, ref ) {
	return (
		<span ref={ ref } aria-hidden="true" className={ className } dir="ltr">
			{ shortcut.displayShortcut }
		</span>
	);
} );

export {
	KeyboardShortcutDescription,
	KeyboardShortcutDisplay,
	useKeyboardShortcutProps,
};
