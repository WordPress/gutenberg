export type ShortcutProps = {
	/**
	 * Classname to apply to the shortcut.
	 */
	className?: string;
	/**
	 * Shortcut configuration
	 */
	shortcut?: string | { display: string; ariaLabel: string };
};
