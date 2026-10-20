import type { ReactElement } from 'react';
import type { LayoutAlignment } from '../../layouts/types';

/**
 * The icon and title of a block alignment option.
 */
export interface BlockAlignmentOption {
	icon: ReactElement;
	title: string;
}

/**
 * The block alignment options, keyed by alignment.
 */
export type BlockAlignmentOptions = Record< string, BlockAlignmentOption >;

/**
 * Props of `BlockAlignmentControl` and `BlockAlignmentToolbar`.
 */
export interface BlockAlignmentControlProps {
	/**
	 * The current value of the alignment setting.
	 */
	value?: string;
	/**
	 * A callback function invoked when the toolbar's alignment value is
	 * changed, with `undefined` to unset it.
	 */
	onChange: ( align: string | undefined ) => void;
	/**
	 * The alignments the block supports.
	 */
	controls?: string[];
	/**
	 * Whether the toolbar group is collapsed into a dropdown.
	 */
	isCollapsed?: boolean;
	/**
	 * The label of the control.
	 */
	label?: string;
	/**
	 * The description passed to the dropdown's toggle.
	 */
	description?: string;
}

/**
 * Props of the shared UI of the block alignment controls.
 */
export interface BlockAlignmentUIProps extends BlockAlignmentControlProps {
	isToolbar?: boolean;
}

/**
 * The editor settings that decide which alignments are available.
 */
export interface AlignmentSettings {
	/**
	 * Whether the theme enables wide alignments.
	 */
	wideControlsEnabled: boolean;
	/**
	 * Whether the theme supports the layout config.
	 */
	themeSupportsLayout?: boolean;
	/**
	 * Whether the theme is block based.
	 */
	isBlockBasedTheme?: boolean;
}

/**
 * The alignments a block supports, split into the ones the parent layout
 * offers and the wide ones it does not.
 */
export interface AlignmentMenu {
	enabled: LayoutAlignment[];
	unavailable: string[];
}
