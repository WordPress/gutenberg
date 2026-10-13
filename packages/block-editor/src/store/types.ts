import type { Block } from '@wordpress/blocks';
import type { BlockEditingMode } from '../components/block-editing-mode';
import type { InserterMediaCategory } from './actions';

export interface BlockAttributes {
	metadata?: Record< string, unknown > & {
		name?: string;
		patternName?: string;
		bindings?: Record< string, unknown >;
	};
	[ key: string ]: unknown;
}

/**
 * A block as stored in `byClientId`, without its attributes and inner blocks.
 */
export type BlockWithoutAttributes = Omit<
	Block< BlockAttributes >,
	'attributes' | 'innerBlocks'
>;

/**
 * A denormalized block in the block tree.
 */
export type TreeBlock = Omit< Block< BlockAttributes >, 'innerBlocks' > & {
	innerBlocks: TreeBlock[];
};

/**
 * The root entry, keyed by `''`, and the controlled entries, keyed by
 * `controlled||<clientId>`, which only carry the inner blocks.
 */
export interface TreeInnerBlocksEntry {
	innerBlocks: TreeBlock[];
}

export type BlockTreeNode = TreeBlock | TreeInnerBlocksEntry;

/**
 * A block reached by walking the tree: the root, patched with an empty client
 * ID, or a controlled block whose controlled inner blocks may be missing.
 */
export type TraversedBlock = Partial< Omit< TreeBlock, 'clientId' > > & {
	clientId: string;
};

export type { BlockEditingMode, InserterMediaCategory };

export interface BlockSelection {
	/**
	 * A block client ID.
	 */
	clientId?: string;
	/**
	 * A block attribute key.
	 */
	attributeKey?: string;
	/**
	 * An attribute value offset, based on the rich text value.
	 */
	offset?: number;
}

export type InitialPosition = 0 | -1 | null;

export type HistoryMode = 'merge' | 'ignore';

export type BlockListSettings = Record< string, unknown > & {
	templateLock?: string | false;
};

export type Settings = Record< string | symbol, unknown >;

export interface InsertionCue {
	rootClientId?: string;
	index?: number;
	__unstableWithInserter?: boolean;
	operation?: string;
	nearestSide?: string;
}

export interface InsertionPoint {
	rootClientId?: string;
	index?: number;
}

export interface BlocksState {
	byClientId: Map< string, BlockWithoutAttributes >;
	attributes: Map< string, BlockAttributes >;
	order: Map< string, string[] >;
	parents: Map< string, string >;
	controlledInnerBlocks: Set< string >;
	blockEditingModes: Map< string, BlockEditingMode >;
	tree: Map< string, BlockTreeNode >;
	isPersistentChange?: boolean;
	isIgnoredChange?: boolean;
	lastBlockChangeHistoryMode?: HistoryMode;
}

export interface SelectionState {
	selectionStart?: BlockSelection;
	selectionEnd?: BlockSelection;
}

export interface RemovalPromptData {
	clientIds: string[];
	selectPrevious: boolean;
	message: string;
}

export interface SelectedBlockStyleState {
	clientId: string;
	showStateOnCanvas: boolean;
	value: Record< string, unknown > & { pseudo: string };
}

export interface State {
	blocks: BlocksState;
	isDragging: boolean;
	isTyping: boolean;
	isBlockInterfaceHidden: boolean;
	draggedBlocks: string[];
	selection: SelectionState;
	isMultiSelecting: boolean;
	isSelectionEnabled: boolean;
	initialPosition: InitialPosition | undefined;
	blocksMode: Record< string, 'html' | 'visual' >;
	blockListSettings: Map< string, BlockListSettings >;
	insertionPoint: InsertionPoint | null;
	insertionCue: InsertionCue | null;
	template: { isValid: boolean };
	settings: Settings;
	preferences: {
		insertUsage: Record< string, { time?: number; count: number } >;
	};
	lastBlockAttributesChange: Record< string, BlockAttributes > | null;
	lastFocus: HTMLElement | null | false;
	expandedBlock: string | null;
	highlightedBlock: string | null | undefined;
	lastBlockInserted: { clientIds?: string[]; source?: string };
	editedContentOnlySection: string | undefined;
	blockVisibility: Record< string, boolean >;
	viewportModalClientIds: string[] | null;
	styleOverrides: Map< unknown, unknown >;
	removalPromptData: RemovalPromptData | false;
	blockRemovalRules: Record< string, string > | false;
	registeredInserterMediaCategories: InserterMediaCategory[];
	zoomLevel: number | 'auto-scaled';
	hasBlockSpotlight: string | null | undefined;
	openedListViewPanels: {
		allOpen: boolean;
		panels: Record< string, boolean >;
	};
	listViewExpandRevision: number;
	listViewContentPanelOpen: boolean;
	requestedInspectorTab: {
		tabName: string;
		options?: Record< string, unknown >;
	} | null;
	selectedBlockStyleState: SelectedBlockStyleState | undefined;
	styleStateViewport: string;
	isResponsiveEditing: boolean;
	derivedBlockEditingModes: Map< string, BlockEditingMode >;
	automaticChangeStatus?: 'pending' | 'final';
}

type BlocksMeta = { source?: string } & Record< string, unknown >;

export type Action =
	| { type: 'CLEAR_BLOCK_REMOVAL_PROMPT' }
	| { type: 'CLEAR_REQUESTED_INSPECTOR_TAB' }
	| { type: 'CLEAR_SELECTED_BLOCK' }
	| { type: 'CLOSE_LIST_VIEW_CONTENT_PANEL' }
	| { type: 'DELETE_STYLE_OVERRIDE'; id: unknown }
	| { type: 'DO_NOTHING' }
	| ( { type: 'DISPLAY_BLOCK_REMOVAL_PROMPT' } & RemovalPromptData )
	| { type: 'EDIT_CONTENT_ONLY_SECTION'; clientId: string | undefined }
	| { type: 'HIDE_BLOCK_INTERFACE' }
	| { type: 'HIDE_INSERTION_POINT' }
	| { type: 'HIDE_VIEWPORT_MODAL' }
	| { type: 'INCREMENT_LIST_VIEW_EXPAND_REVISION' }
	| {
			type: 'INSERT_BLOCKS';
			blocks: Block[];
			index?: number;
			rootClientId?: string;
			updateSelection?: boolean;
			initialPosition?: InitialPosition;
			meta?: BlocksMeta;
			time?: number;
	  }
	| { type: 'LAST_FOCUS'; lastFocus: HTMLElement | null | false }
	| { type: 'MARK_AUTOMATIC_CHANGE' }
	| { type: 'MARK_AUTOMATIC_CHANGE_FINAL' }
	| { type: 'MARK_LAST_CHANGE_AS_PERSISTENT' }
	| { type: 'MARK_NEXT_CHANGE_AS_NOT_PERSISTENT'; history?: HistoryMode }
	| {
			type: 'MOVE_BLOCKS_TO_POSITION';
			clientIds: string[];
			fromRootClientId?: string;
			toRootClientId?: string;
			index?: number;
	  }
	| { type: 'MOVE_BLOCKS_UP'; clientIds: string[]; rootClientId?: string }
	| { type: 'MOVE_BLOCKS_DOWN'; clientIds: string[]; rootClientId?: string }
	| {
			type: 'MULTI_SELECT';
			start: string;
			end: string;
			initialPosition?: InitialPosition;
	  }
	| { type: 'OPEN_LIST_VIEW_CONTENT_PANEL' }
	| { type: 'RECEIVE_BLOCKS'; blocks: Block[]; rootClientId?: never }
	| {
			type: 'REGISTER_INSERTER_MEDIA_CATEGORY';
			category: InserterMediaCategory;
	  }
	| {
			type: 'REMOVE_BLOCKS';
			clientIds: string[];
			keepControlledInnerBlocks?: Record< string, boolean >;
	  }
	| {
			type: 'REMOVE_BLOCKS_AUGMENTED_WITH_CHILDREN';
			clientIds: string[];
			removedClientIds: string[];
			keepControlledInnerBlocks?: Record< string, boolean >;
	  }
	| {
			type: 'REPLACE_BLOCKS';
			clientIds: string[];
			blocks: Block[];
			indexToSelect?: number;
			initialPosition?: InitialPosition;
			meta?: BlocksMeta;
			time?: number;
	  }
	| {
			type: 'REPLACE_BLOCKS_AUGMENTED_WITH_CHILDREN';
			clientIds: string[];
			replacedClientIds: string[];
			blocks: Block[];
			indexToSelect?: number;
			initialPosition?: InitialPosition;
			meta?: BlocksMeta;
			time?: number;
	  }
	| {
			type: 'REPLACE_INNER_BLOCKS';
			rootClientId: string;
			blocks: Block[];
			updateSelection?: boolean;
			initialPosition?: InitialPosition;
			time?: number;
	  }
	| {
			type: 'REQUEST_INSPECTOR_TAB';
			tabName: string;
			options?: Record< string, unknown >;
	  }
	| { type: 'RESET_BLOCKS'; blocks: Block[] }
	| {
			type: 'RESET_SELECTION';
			selectionStart: BlockSelection;
			selectionEnd: BlockSelection;
			initialPosition?: InitialPosition;
	  }
	| { type: 'RESET_ZOOM_LEVEL' }
	| {
			type: 'SELECTION_CHANGE';
			clientId?: string;
			attributeKey?: string;
			startOffset?: number;
			endOffset?: number;
			start?: BlockSelection;
			end?: BlockSelection;
	  }
	| {
			type: 'SELECT_BLOCK';
			clientId: string;
			initialPosition?: InitialPosition;
			start?: never;
			end?: never;
	  }
	| { type: 'SET_ALL_LIST_VIEW_PANELS_OPEN' }
	| {
			type: 'SET_BLOCK_EDITING_MODE';
			clientId: string;
			mode: BlockEditingMode;
	  }
	| { type: 'SET_BLOCK_EXPANDED_IN_LIST_VIEW'; clientId: string | null }
	| {
			type: 'SET_BLOCK_REMOVAL_RULES';
			rules: Record< string, string > | false;
	  }
	| { type: 'SET_BLOCK_VISIBILITY'; updates: Record< string, boolean > }
	| { type: 'SET_EDITOR_MODE' }
	| {
			type: 'SET_HAS_CONTROLLED_INNER_BLOCKS';
			clientId: string;
			hasControlledInnerBlocks: boolean;
	  }
	| { type: 'SET_INSERTION_POINT'; value: InsertionPoint | null }
	| { type: 'SET_OPEN_LIST_VIEW_PANEL'; clientId: string | null }
	| { type: 'SET_RESPONSIVE_EDITING'; enabled: boolean }
	| {
			type: 'SET_SELECTED_BLOCK_STYLE_STATE';
			clientId: string;
			value: Record< string, unknown >;
	  }
	| {
			type: 'SET_SELECTED_BLOCK_STYLE_STATE_CANVAS_PREVIEW';
			clientId: string;
			value: boolean;
	  }
	| { type: 'SET_STYLE_OVERRIDE'; id: unknown; style: unknown }
	| { type: 'SET_STYLE_STATE_VIEWPORT'; viewport?: string }
	| { type: 'SET_TEMPLATE_VALIDITY'; isValid: boolean }
	| { type: 'SET_ZOOM_LEVEL'; zoom: number | 'auto-scaled' }
	| { type: 'SHOW_BLOCK_INTERFACE' }
	| ( { type: 'SHOW_INSERTION_POINT' } & InsertionCue )
	| { type: 'SHOW_VIEWPORT_MODAL'; clientIds: string[] }
	| { type: 'START_DRAGGING' }
	| { type: 'START_DRAGGING_BLOCKS'; clientIds: string[] }
	| { type: 'START_MULTI_SELECT' }
	| { type: 'START_TYPING' }
	| { type: 'STOP_DRAGGING' }
	| { type: 'STOP_DRAGGING_BLOCKS' }
	| { type: 'STOP_MULTI_SELECT' }
	| { type: 'STOP_TYPING' }
	| { type: 'SYNCHRONIZE_TEMPLATE' }
	| {
			type: 'TOGGLE_BLOCK_HIGHLIGHT';
			clientId: string;
			isHighlighted: boolean;
	  }
	| { type: 'TOGGLE_BLOCK_MODE'; clientId: string }
	| {
			type: 'TOGGLE_BLOCK_SPOTLIGHT';
			clientId: string;
			hasBlockSpotlight: boolean;
	  }
	| { type: 'TOGGLE_LIST_VIEW_PANEL'; clientId: string; isOpen: boolean }
	| { type: 'TOGGLE_SELECTION'; isSelectionEnabled: boolean }
	| { type: 'UNSET_BLOCK_EDITING_MODE'; clientId: string }
	| { type: 'UPDATE_BLOCK'; clientId: string; updates: Partial< Block > }
	| {
			type: 'UPDATE_BLOCK_ATTRIBUTES';
			clientIds: string[];
			attributes: BlockAttributes;
			options?: { uniqueByBlock?: false };
	  }
	| {
			type: 'UPDATE_BLOCK_ATTRIBUTES';
			clientIds: string[];
			attributes: Record< string, BlockAttributes >;
			options: { uniqueByBlock: true };
	  }
	| {
			type: 'UPDATE_BLOCK_LIST_SETTINGS';
			clientId: string | Record< string, BlockListSettings | undefined >;
			settings?: BlockListSettings;
	  }
	| { type: 'UPDATE_SETTINGS'; settings: Settings; reset?: boolean };

export type RemoveBlocksAction = Extract< Action, { type: 'REMOVE_BLOCKS' } >;

export type Reducer< S > = ( state: S | undefined, action: Action ) => S;
