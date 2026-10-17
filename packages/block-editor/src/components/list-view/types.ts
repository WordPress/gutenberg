import type {
	ComponentType,
	Dispatch,
	FocusEventHandler,
	HTMLAttributes,
	KeyboardEvent,
	MouseEvent,
	ReactNode,
	RefObject,
	SetStateAction,
	DragEvent,
	ForwardedRef,
} from 'react';
import type { Block } from '@wordpress/blocks';
import type { ClientIdsTreeNode } from '../../store/types';
import type { BlockSettingsDropdownProps } from '../block-settings-menu/types';

/**
 * Where the dragged blocks land relative to the target block. `inside` nests
 * them as inner blocks.
 */
export type ListViewDropPosition = 'top' | 'bottom' | 'inside';

/**
 * How a row moves to make room for the drop indicator.
 */
export type ListViewDisplacement = 'normal' | 'up' | 'down';

/**
 * An update of the expansion state: `replace` keeps only the listed blocks
 * expanded.
 */
export type ListViewExpansionAction = {
	type: 'expand' | 'collapse' | 'replace';
	clientIds: string[];
};

/**
 * Whether each block is expanded, keyed by client ID. Unrecorded blocks fall
 * back to the `isExpanded` prop.
 */
export type ListViewExpansionState = Partial< Record< string, boolean > >;

export type UpdateListViewExpansion = Dispatch< ListViewExpansionAction >;

/**
 * Selects a block from the list view. A `null` focus position keeps focus in
 * the list view.
 */
/**
 * The event that changes the selection from the list view.
 */
export type ListViewSelectionEvent = Pick<
	MouseEvent | KeyboardEvent | globalThis.KeyboardEvent,
	'shiftKey' | 'type' | 'preventDefault'
> & {
	keyCode?: number;
	detail?: number;
};

export type ListViewSelectBlock = (
	event: ListViewSelectionEvent | undefined,
	clientId: string | undefined,
	focusPosition?: 0 | -1 | null,
	unused?: null
) => void;

/**
 * Data about a block row in the DOM, used by drag and drop.
 */
export type ListViewDropZoneBlock = {
	/** The client id for the block. */
	clientId: string;
	/** The root client id for the block. */
	rootClientId: string | null;
	/** The block's index. */
	blockIndex: number;
	/** The DOM element representing the block. */
	element: Element;
	/** The nesting level of the block. */
	nestingLevel?: number;
	/** The number of inner blocks the block has. */
	innerBlockCount: number;
	/** Whether the block is currently being dragged. */
	isDraggedBlock: boolean;
	/** Whether the block is expanded in the UI. */
	isExpanded: boolean;
	/** Whether the dragged block can be a sibling of this block. */
	canInsertDraggedBlocksAsSibling: boolean;
	/** Whether the dragged block can be a child of this block. */
	canInsertDraggedBlocksAsChild: boolean;
};

/**
 * The details of a drop target.
 */
export type ListViewDropZoneTarget = {
	/** The insertion index. */
	blockIndex: number | undefined;
	/** The root client id for the block. */
	rootClientId: string | null;
	/** The client id for the block. */
	clientId: string | undefined;
	/** The position relative to the block that the user is dropping to. */
	dropPosition: ListViewDropPosition;
};

export type UseListViewDropZoneOptions = {
	/** Optional element to be used as the drop zone. */
	dropZoneElement?: HTMLElement | null;
	/** Dispatch to update the expansion state of a list of block clientIds. */
	updateExpansion: UpdateListViewExpansion;
};

/**
 * Props of the component that renders additional content for the row of the
 * block that was just inserted.
 */
export type AdditionalBlockContentProps = {
	insertedBlockClientId: string;
	setInsertedBlockClientId: Dispatch< SetStateAction< string | null > >;
};

/**
 * Props of the settings menu of each row.
 */
export type ListViewBlockSettingsMenuProps = Omit<
	BlockSettingsDropdownProps,
	'toggleProps'
> & {
	toggleProps?: BlockSettingsDropdownProps[ 'toggleProps' ] & {
		ref?: ForwardedRef< HTMLButtonElement >;
	};
	disableOpenOnArrowDown?: boolean;
	updateExpansion?: UpdateListViewExpansion;
	setInsertedBlockClientId?: Dispatch< SetStateAction< string | null > >;
};

/**
 * Values that never change for the lifetime of a List View.
 */
export type ListViewContextValue = {
	AdditionalBlockContent?: ComponentType< AdditionalBlockContentProps > | null;
	BlockSettingsMenu?: ComponentType< ListViewBlockSettingsMenuProps >;
	listViewInstanceId?: number | string;
	rootClientId?: string | null;
	setInsertedBlockClientId: Dispatch< SetStateAction< string | null > >;
	treeGridElementRef?: RefObject< HTMLElement | null >;
	updateExpansion: UpdateListViewExpansion;
};

/**
 * Expansion and drag state of a List View.
 */
export type ListViewTreeStateContextValue = {
	blockDropPosition?: ListViewDropPosition;
	blockDropTargetIndex?: number | null;
	blockIndexes: Partial< Record< string, number > >;
	draggedClientIds?: string[];
	expansionState: ListViewExpansionState;
	firstDraggedBlockIndex?: number;
};

export type ListViewProps = {
	/** An HTML element id for the root element of ListView. */
	id?: string;
	/** _deprecated_ Custom subset of block client IDs to be used instead of the default hierarchy. */
	blocks?: ClientIdsTreeNode[];
	/** Optional element to be used as the drop zone. */
	dropZoneElement?: HTMLElement | null;
	/** Flag to enable block movers. Defaults to `false`. */
	showBlockMovers?: boolean;
	/** Flag to determine whether nested levels are expanded by default. Defaults to `false`. */
	isExpanded?: boolean;
};

export type PrivateListViewProps = ListViewProps & {
	/** Flag to show or hide the block appender. Defaults to `false`. */
	showAppender?: boolean;
	/** Flag to move focus into the list when it mounts. Defaults to `false`. */
	focusOnMount?: boolean;
	/** Optional more menu substitution. Defaults to the standard `BlockSettingsDropdown` component. */
	blockSettingsMenu?: ComponentType< ListViewBlockSettingsMenuProps >;
	/** The client id of the root block from which we determine the blocks to show in the list. */
	rootClientId?: string | null;
	/** Optional accessible description for the tree grid component. */
	description?: string;
	/** Optional callback to be invoked when a block is selected. Receives the block object that was selected. */
	onSelect?: ( ( block: Block | null ) => void ) | null;
	/** Component that renders additional block content UI. */
	additionalBlockContent?: ComponentType< AdditionalBlockContentProps > | null;
	/** Flag to render the selected block's content controls in a popover anchored to its row. Defaults to `false`. */
	showContentPopover?: boolean;
};

/**
 * The window of rows that the list view renders.
 */
export type FixedListWindow = {
	itemInView: ( index: number ) => boolean;
};

export type ListViewBranchProps = {
	blocks: ClientIdsTreeNode[];
	selectBlock?: ListViewSelectBlock;
	showBlockMovers?: boolean;
	selectedClientIds: string[];
	level?: number;
	path?: string;
	isBranchSelected?: boolean;
	listPosition?: number;
	fixedListWindow: FixedListWindow;
	isExpanded?: boolean;
	parentId?: string | null;
	isSyncedBranch?: boolean;
	showAppender?: boolean;
};

export type ListViewBlockProps = {
	clientId: string;
	displacement?: ListViewDisplacement;
	isAfterDraggedBlocks?: boolean;
	isDragged: boolean;
	isNesting?: boolean;
	isSelected: boolean;
	isBranchSelected: boolean;
	selectBlock: ListViewSelectBlock;
	position: number;
	level: number;
	rowCount: number;
	siblingBlockCount: number;
	showBlockMovers?: boolean;
	path: string;
	isExpanded?: boolean;
	selectedClientIds: string[];
	isSyncedBranch: boolean;
};

/**
 * Props of a list view row. Other props go to the tree grid row.
 */
export type ListViewLeafProps = Omit<
	HTMLAttributes< HTMLTableRowElement >,
	'children'
> & {
	isDragged?: boolean;
	isSelected?: boolean;
	position: number;
	level: number;
	rowCount: number;
	children?: ReactNode;
	path: string;
	'data-block': string;
	'data-expanded'?: boolean;
};

export type ListViewBlockSelectButtonProps = {
	className?: string;
	clientId: string;
	onClick: ( event: MouseEvent | KeyboardEvent ) => void;
	onContextMenu?: ( event: MouseEvent ) => void;
	onMouseDown?: ( event: MouseEvent ) => void;
	onToggleExpanded?: ListViewExpanderProps[ 'onClick' ];
	tabIndex?: number;
	onFocus?: FocusEventHandler;
	onDragStart?: ( event: DragEvent ) => void;
	onDragEnd?: ( event: DragEvent ) => void;
	draggable?: boolean;
	isExpanded?: boolean;
	isSelected?: boolean;
	ariaDescribedBy?: string;
	visibilityLabel?: string | null;
	isDisabled?: boolean;
};

export type ListViewBlockContentsProps = Omit<
	ListViewBlockSelectButtonProps,
	'draggable' | 'onDragStart' | 'onDragEnd' | 'className'
> & {
	selectedClientIds: string[];
};

export type ListViewExpanderProps = {
	onClick?: ( event: MouseEvent, options: { forceToggle: boolean } ) => void;
};

export type ListViewAppenderProps = {
	nestingLevel: number;
	blockCount: number;
	clientId?: string | null;
	tabIndex?: number;
	onFocus?: FocusEventHandler;
};

/**
 * Props that a tree grid item passes to the control it renders.
 */
export type TreeGridItemRenderProps = {
	ref: ForwardedRef< HTMLButtonElement >;
	tabIndex?: number;
	onFocus?: FocusEventHandler;
};

export type ListViewDropIndicatorPreviewProps = {
	draggedBlockClientId?: string;
	listViewRef: RefObject< HTMLElement | null >;
	blockDropTarget?: ListViewDropZoneTarget | null;
};

/**
 * A preview image of a list view row.
 */
export type ListViewImage = {
	url: string;
	alt: string;
	clientId: string;
};

export type DragDisplacementOptions = {
	/** The indexes of all the blocks in the list view, keyed by clientId. */
	blockIndexes: Partial< Record< string, number > >;
	/** The index of the block that the user is dropping to. */
	blockDropTargetIndex?: number | null;
	/** The position relative to the block that the user is dropping to. */
	blockDropPosition?: string;
	/** The client id for the current block. */
	clientId: string;
	/** The index of the first dragged block. */
	firstDraggedBlockIndex?: number;
	/** Whether the current block is being dragged. Dragged blocks skip displacement. */
	isDragged?: boolean;
};
