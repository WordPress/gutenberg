import type { BlockShortcut } from '@wordpress/blocks';

/**
 * A keyboard shortcut a block type declares, paired with the block change it
 * makes.
 */
export type DeclaredBlockShortcut = BlockShortcut & {
	targetBlockName: string;
	blockNames: string[];
	variationName?: string;
};

/**
 * Props of the component handling one declared shortcut.
 */
export interface BlockShortcutProps {
	entry: DeclaredBlockShortcut;
	apply: ( entry: DeclaredBlockShortcut ) => boolean;
}

/**
 * Props of the component registering the declared shortcuts.
 */
export interface BlockShortcutsRegisterProps {
	shortcuts: DeclaredBlockShortcut[];
}
