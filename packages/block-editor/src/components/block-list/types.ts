import type {
	ComponentType,
	CSSProperties,
	ReactNode,
	Ref,
	RefCallback,
	RefObject,
} from 'react';
import type { Block, BlockType, RawBlock } from '@wordpress/blocks';
import type { InitialPosition } from '../../store/types';
import type { BlockEditingMode } from '../block-editing-mode';
import type {
	BlockVisibility,
	ViewportBreakpoints,
} from '../block-visibility/use-block-visibility';
import type { BlockVisibilityViewport } from '../block-visibility/constants';

/**
 * The private information a block list block passes to its edit component
 * and wrapper props.
 */
export interface PrivateBlockContextValue {
	isPreviewMode?: boolean;
	/** The default block shown before the user inserts it. */
	ghostBlock?: Block;
	ariaLabel?: string;
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
	initialPosition?: number | boolean | null;
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
	deviceType?: BlockVisibilityViewport;
	viewportSettings?: ViewportBreakpoints;
	supportsSplitting?: boolean;
	wrapperProps?: BlockListWrapperProps;
	isAligned?: boolean;
}

export interface BlockCrashBoundaryProps {
	/** Rendered in place of the children once they throw. */
	fallback: ReactNode;
	children?: ReactNode;
}

/**
 * The props that block supports and the block type add to the block wrapper.
 */
export type BlockListWrapperProps = Record< string, unknown > & {
	className?: string;
	style?: Partial< Record< string, string | number > >;
	'data-align'?: string;
};

/**
 * Props passed to `useBlockProps`, merged into the returned props.
 */
export type UseBlockPropsProps = Record< string, unknown > & {
	/** A falsy ref is ignored, and an object ref may start out `undefined`. */
	ref?:
		| Ref< HTMLElement >
		| RefObject< HTMLElement | null | undefined >
		| false;
	className?: string;
	style?: CSSProperties;
	'aria-label'?: string;
};

export interface UseBlockPropsOptions {
	__unstableIsHtml?: boolean;
}

/**
 * Props to pass to the element to mark as a block.
 */
export type UseBlockPropsResult = Record< string, unknown > & {
	ref: RefCallback< HTMLElement >;
	id: string;
	role: string;
	tabIndex?: number;
	draggable?: boolean;
	className: string;
	style: CSSProperties;
	'aria-label'?: string;
	'data-block'?: string;
	'data-type'?: string;
	'data-title'?: string;
};

/**
 * Props of `BlockList`. Other props are inner blocks options.
 */
export type BlockListProps = Record< string, unknown > & {
	className?: string;
};

export interface BlockListItemsProps {
	/** Rendered when the list has no blocks. */
	placeholder?: ReactNode;
	rootClientId?: string | null;
	/** A custom appender, or `false` for none. */
	renderAppender?: ComponentType | false;
	__experimentalAppenderTagName?: string;
	layout?: Record< string, unknown >;
}

/**
 * The props of the block list block passed through the
 * `editor.BlockListBlock` filters. They are public API.
 */
export interface BlockListBlockProps {
	/** The block, for filters that predate the `clientId` prop. */
	block: Partial< Block > & { __unstableBlockSource?: RawBlock };
	mode?: string;
	isLocked?: boolean;
	canRemove?: boolean;
	canMove?: boolean;
	clientId: string;
	rootClientId?: string | null;
	isSelected?: boolean;
	isSelectionEnabled?: boolean;
	className?: string;
	__unstableLayoutClassNames?: string;
	name: string;
	isValid?: boolean;
	attributes: Record< string, unknown >;
	wrapperProps?: BlockListWrapperProps;
	setAttributes: BlockSetAttributes;
	onReplace: BlockListBlockOnReplace;
	onRemove: () => void;
	onInsertBlocksAfter: ( blocks: Block[] ) => void;
	onMerge: ( forward?: boolean ) => void;
	toggleSelection: ( isSelectionEnabled?: boolean ) => void;
}

/**
 * Updates the attributes from an object, or from a function of the current
 * attributes.
 */
export type BlockSetAttributes = (
	nextAttributes:
		| Record< string, unknown >
		| ( (
				attributes: Record< string, unknown >
		  ) => Record< string, unknown > )
) => void;

/**
 * Replaces the block. Unsynced patterns arrive nested in an array.
 */
export type BlockListBlockOnReplace = (
	blocks: Block | Block[] | [ Block[] ],
	indexToSelect?: number | null,
	initialPosition?: InitialPosition
) => void;

/**
 * The props of a block list block rendered by the block list.
 */
export interface BlockListBlockProviderProps {
	clientId: string;
	rootClientId?: string | null;
	/** The default block shown before the user inserts it. */
	ghostBlock?: Block;
}

/**
 * The block data the block list block selects from the store.
 */
export type BlockListBlockSelectedProps = Omit<
	PrivateBlockContextValue,
	'clientId' | 'rootClientId' | 'ghostBlock' | 'wrapperProps'
> & {
	blockWithoutAttributes: Partial< Block >;
	name: string;
	attributes: Record< string, unknown >;
	isValid?: boolean;
	isSelectionEnabled?: boolean;
	isLocked?: boolean;
	canRemove?: boolean;
};
