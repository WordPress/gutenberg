import type { BlockType } from '@wordpress/blocks';
import type { BlockEditingMode } from '../block-editing-mode';
import type { BlockVisibility } from '../block-visibility/use-block-visibility';

/**
 * The private information a block list block passes to its edit component
 * and wrapper props.
 */
export interface PrivateBlockContextValue {
	isPreviewMode?: boolean;
	ghostBlock?: unknown;
	rootClientId?: string | null;
	clientId?: string;
	className?: string;
	index?: number;
	mode?: string;
	name?: string;
	blockApiVersion?: number;
	blockType?: BlockType;
	blockTitle?: string;
	isSelected?: boolean;
	isSubtreeDisabled?: boolean;
	hasOverlay?: boolean;
	initialPosition?: unknown;
	blockEditingMode?: BlockEditingMode;
	isHighlighted?: boolean;
	isMultiSelected?: boolean;
	isPartiallySelected?: boolean;
	isReusable?: boolean;
	isDragging?: boolean;
	hasChildSelected?: boolean;
	isSectionBlock?: boolean;
	isWithinSectionBlock?: boolean;
	isSelectionWithinCurrentSection?: boolean;
	isEditingDisabled?: boolean;
	hasEditableOutline?: boolean;
	isEditingContentOnlySection?: boolean;
	defaultClassName?: string;
	mayDisplayControls?: boolean;
	mayDisplayParentControls?: boolean;
	/**
	 * The client ID of the first block of a type that can only be used once,
	 * or `false` for a valid block.
	 */
	originalBlockClientId?: string | false;
	themeSupportsLayout?: boolean;
	canMove?: boolean;
	isBlockCurrentlyHidden?: boolean;
	/**
	 * The attributes of the block that block bindings can connect.
	 */
	bindableAttributes?: string[];
	blockVisibility?: BlockVisibility;
	deviceType?: string;
	viewportSettings?: unknown;
	supportsSplitting?: boolean;
	wrapperProps?: Record< string, unknown >;
	isAligned?: boolean;
}
