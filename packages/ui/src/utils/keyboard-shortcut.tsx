import type { AriaAttributes } from 'react';
import { useId } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { VisuallyHidden } from '../visually-hidden';

export interface KeyboardShortcut {
	/**
	 * The human-readable representation of the shortcut, displayed visually.
	 * Use platform-appropriate symbols (e.g., "⌘S" on macOS, "Ctrl+S" on
	 * Windows).
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
	 * A human-readable description of the shortcut for assistive technology.
	 */
	description: string;
}

type ShortcutAriaProps = Pick<
	AriaAttributes,
	'aria-describedby' | 'aria-keyshortcuts'
>;

function useKeyboardShortcut( {
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
		shortcutAriaProps: {
			'aria-describedby': describedBy || undefined,
			'aria-keyshortcuts': shortcut?.ariaKeyShortcut ?? ariaKeyShortcuts,
		},
	};
}

function KeyboardShortcutDescription( {
	descriptionId,
	shortcut,
}: {
	descriptionId: string;
	shortcut: KeyboardShortcut;
} ) {
	return (
		<VisuallyHidden
			id={ descriptionId }
			aria-hidden="true"
			render={ <span /> }
		>
			{ sprintf(
				/* translators: %s: human-readable keyboard shortcut. */
				__( 'Keyboard shortcut: %s' ),
				shortcut.description
			) }
		</VisuallyHidden>
	);
}

function KeyboardShortcutDisplay( {
	className,
	shortcut,
}: {
	className?: string;
	shortcut: KeyboardShortcut;
} ) {
	return (
		<span aria-hidden="true" className={ className } dir="ltr">
			{ shortcut.displayShortcut }
		</span>
	);
}

export {
	KeyboardShortcutDescription,
	KeyboardShortcutDisplay,
	useKeyboardShortcut,
};
