import type {
	Block,
	BlockEditProps as BlockTypeEditProps,
} from '@wordpress/blocks';
import type { BlockEditingMode } from '../block-editing-mode';
import type { BlockAttributes, InitialPosition } from '../../store/types';
import type {
	mayDisplayControlsKey,
	mayDisplayParentControlsKey,
	mayDisplayPatternEditingControlsKey,
	blockEditingModeKey,
	blockBindingsKey,
	isPreviewModeKey,
	isMultiSelectedKey,
	isInListViewBlockSupportTreeKey,
} from './context';

export interface BlockEditContextValue {
	name: string;
	isSelected?: boolean;
	clientId?: string;
	layout?: Record< string, unknown > | null;
	__unstableLayoutClassNames?: string;
	[ mayDisplayControlsKey ]?: boolean;
	[ mayDisplayParentControlsKey ]?: boolean;
	[ mayDisplayPatternEditingControlsKey ]?: boolean;
	[ blockEditingModeKey ]?: BlockEditingMode;
	[ blockBindingsKey ]?: Record< string, unknown > | null;
	[ isPreviewModeKey ]?: boolean;
	[ isMultiSelectedKey ]?: boolean;
	[ isInListViewBlockSupportTreeKey ]?: boolean;
}

/**
 * The props `BlockEdit` passes through the `editor.BlockEdit` filters to the
 * block type's edit component. They are public API.
 */
export interface BlockEditPublicProps extends Partial<
	Omit< BlockTypeEditProps< BlockAttributes >, 'setAttributes' >
> {
	name: string;
	/**
	 * Updates the attributes; bound attributes only update from an object,
	 * not from the updater form.
	 */
	setAttributes?: ( attributes: Record< string, unknown > ) => void;
	/**
	 * Replaces the block, selecting the block at `indexToSelect`.
	 */
	onReplace?: (
		blocks: Block | Block[],
		indexToSelect?: number | null,
		initialPosition?: InitialPosition
	) => void;
	__unstableLayoutClassNames?: string;
	[ prop: string ]: unknown;
}

/**
 * Props of `BlockEdit`.
 */
export interface BlockEditProps extends BlockEditPublicProps {
	mayDisplayControls?: boolean;
	mayDisplayParentControls?: boolean;
	mayDisplayPatternEditingControls?: boolean;
	blockEditingMode?: BlockEditingMode;
	isPreviewMode?: boolean;
	isMultiSelected?: boolean;
}

/**
 * Props of the warning shown for a second use of a block that can only be
 * used once.
 */
export interface MultipleUsageWarningProps {
	originalBlockClientId: string;
	name: string;
	onReplace: ( blocks: Block[] ) => void;
}
