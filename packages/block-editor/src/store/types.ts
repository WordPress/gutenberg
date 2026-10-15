import type {
	Block,
	BlockTypeIcon,
	BlockVariation,
	synchronizeBlocksWithTemplate,
} from '@wordpress/blocks';
import type { ThunkArgs, select as globalSelect } from '@wordpress/data';
import type { BlockEditingMode } from '../components/block-editing-mode';
import type { BlockVisibility } from '../components/block-visibility/use-block-visibility';
import type { WPDropOperation } from '../components/use-on-block-drop/types';
import type { store } from '.';
import type * as privateSelectors from './private-selectors';
import type * as privateActions from './private-actions';
import type {
	isIsolatedEditorKey,
	reusableBlocksSelectKey,
	sectionRootClientIdKey,
	selectBlockPatternsKey,
	userPatternCategoriesSelectKey,
} from './private-keys';

export interface BlockAttributes {
	metadata?: Record< string, unknown > & {
		name?: string;
		patternName?: string;
		bindings?: Record< string, unknown >;
		blockVisibility?: BlockVisibility;
	};
	lock?: { move?: boolean; remove?: boolean; edit?: boolean };
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

export type { BlockEditingMode };

/**
 * Interface for inserter media requests.
 */
export interface InserterMediaRequest {
	/**
	 * How many items to fetch per page.
	 */
	per_page: number;
	/**
	 * Which page of results to fetch. Defaults to the first page.
	 */
	page?: number;
	/**
	 * The search term to use for filtering the results.
	 */
	search: string;
}

/**
 * Interface for inserter media responses. Any media resource should map their
 * response to this interface, in order to create the core WordPress media
 * blocks (image, video, audio).
 */
export interface InserterMediaItem {
	/**
	 * The title of the media item.
	 */
	title: string;
	/**
	 * The source url of the media item.
	 */
	url: string;
	/**
	 * The preview source url of the media item to display in the media list.
	 */
	previewUrl?: string;
	/**
	 * The WordPress id of the media item.
	 */
	id?: number;
	/**
	 * The id of the media item from external source.
	 */
	sourceId?: number | string;
	/**
	 * The alt text of the media item.
	 */
	alt?: string;
	/**
	 * The caption of the media item.
	 */
	caption?: string;
}

/**
 * Interface for paginated inserter media responses.
 */
export interface InserterMediaResponse {
	/**
	 * The media items for the requested page.
	 */
	mediaItems: InserterMediaItem[];
	/**
	 * The total number of items across all pages.
	 */
	totalItems: number;
	/**
	 * The total number of pages available.
	 */
	totalPages: number;
}

/**
 * Interface for inserter media category.
 */
export interface InserterMediaCategory {
	/**
	 * The name of the media category, that should be unique among all media
	 * categories.
	 */
	name: string;
	/**
	 * Labels for the media category.
	 */
	labels: {
		/**
		 * General name of the media category. It's used in the inserter media
		 * items list.
		 */
		name: string;
		/**
		 * Label for searching items. Default is ‘Search Posts’ / ‘Search Pages’.
		 */
		search_items?: string;
	};
	/**
	 * The media type of the media category.
	 */
	mediaType: 'image' | 'audio' | 'video';
	/**
	 * The function to fetch media items for the category. Returning an
	 * `InserterMediaResponse` instead of a plain array opts the category into
	 * pagination.
	 */
	fetch: (
		query: InserterMediaRequest
	) => Promise< InserterMediaItem[] | InserterMediaResponse >;
	/**
	 * If the media category supports reporting media items, this function
	 * should return the report url for the media item.
	 */
	getReportUrl?: ( item: InserterMediaItem ) => string;
	/**
	 * If the media category is an external resource, this should be set to
	 * true, to avoid requesting it to check whether it has items to display.
	 */
	isExternalResource?: boolean;
	/**
	 * Optional message shown in place of the generic "No results found." when
	 * the source has no items and there is no active search.
	 */
	emptyMessage?: string;
}

/**
 * A selection object.
 */
export interface Selection {
	/**
	 * The selection start.
	 */
	start: BlockSelection;
	/**
	 * The selection end.
	 */
	end: BlockSelection;
}

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

export interface BlockPattern {
	name: string;
	title?: string;
	content: string;
	categories?: Array< string | number >;
	blocks?: Block[];
	id?: number;
	type?: string;
	syncStatus?: string;
	blockTypes?: string[];
	inserter?: boolean;
	[ key: string ]: unknown;
}

/**
 * A user pattern as returned by the REST API.
 */
export interface UserPattern {
	id: number;
	title?: { raw?: string };
	content: { raw: string };
	wp_pattern_category?: number[];
	wp_pattern_sync_status?: string;
}

export interface UserPatternCategory {
	id: number;
	slug: string;
}

export type InserterVariation = BlockVariation & { isSearchOnly?: boolean };

/**
 * An item shown in the inserter or in the block transforms list.
 */
export interface InserterItem {
	/**
	 * Unique identifier for the item.
	 */
	id: string;
	/**
	 * The type of block to create.
	 */
	name: string;
	/**
	 * Title of the item, as it appears in the inserter.
	 */
	title?: string;
	/**
	 * Icon for the item, as it appears in the inserter.
	 */
	icon?: BlockTypeIcon;
	/**
	 * Whether or not the user should be prevented from inserting this item.
	 */
	isDisabled: boolean;
	/**
	 * Heuristic that combines frequency and recency.
	 */
	frecency: number;
	/**
	 * Attributes to pass to the newly created block.
	 */
	initialAttributes?: Record< string, unknown >;
	/**
	 * Block category that the item is associated with.
	 */
	category?: string;
	/**
	 * Keywords that can be searched to find this item.
	 */
	keywords?: string[];
	description?: string;
	parent?: string[];
	ancestor?: string[];
	variations?: InserterVariation[];
	variationName?: string;
	example?: unknown;
	innerBlocks?: InserterVariation[ 'innerBlocks' ];
	innerContent?: InserterVariation[ 'innerContent' ];
	isSearchOnly?: boolean;
	content?: string;
	blocks?: Block[];
	syncStatus?: string;
	isAllowedInCurrentRoot?: boolean;
	utility?: number;
}

export type InitialPosition = 0 | -1 | null;

export type HistoryMode = 'merge' | 'ignore';

export type BlockListSettings = Record< string, unknown > & {
	templateLock?: string | false;
	defaultBlock?: { name: string; attributes?: Record< string, unknown > };
	directInsert?: boolean;
};

export interface ShowInsertionPointOptions {
	/**
	 * Whether or not to show an inserter button.
	 */
	__unstableWithInserter?: boolean;
	/**
	 * The operation to perform when applied, either 'insert' or 'replace'.
	 */
	operation?: WPDropOperation;
	nearestSide?: string;
}

export type SettingsByClientId = Record<
	string,
	BlockListSettings | undefined
>;

/**
 * A block template: block names with their attributes and inner templates.
 */
export type BlockTemplate = NonNullable<
	Parameters< typeof synchronizeBlocksWithTemplate >[ 1 ]
>;

/**
 * Theme.json settings, optionally overridden per block type under `blocks`.
 */
export type FeatureSettings = Record< string, unknown > & {
	blocks?: Record< string, Record< string, unknown > >;
};

/**
 * A theme.json preset setting, split by the origin that defines it.
 */
export interface PresetsByOrigin {
	custom?: unknown;
	theme?: unknown;
	default?: unknown;
}

/**
 * The editor settings, with the fields the store itself reads.
 */
export type Settings = Record< string | symbol, unknown > & {
	allowedBlockTypes?: boolean | string[];
	allowedMimeTypes?: Record< string, string > | null;
	canLockBlocks?: boolean;
	enableOpenverseMediaCategory?: boolean;
	inserterMediaCategories?: InserterMediaCategory[];
	isPreviewMode?: boolean;
	template?: BlockTemplate;
	templateLock?: string | false;
	__experimentalBlockPatterns?: BlockPattern[];
	__experimentalFeatures?: FeatureSettings;
	__experimentalReusableBlocks?: UserPattern[];
	__experimentalUserPatternCategories?: UserPatternCategory[];
	[ isIsolatedEditorKey ]?: boolean;
	[ reusableBlocksSelectKey ]?: (
		select: typeof globalSelect
	) => UserPattern[] | null;
	[ sectionRootClientIdKey ]?: string;
	[ selectBlockPatternsKey ]?: (
		select: typeof globalSelect
	) => BlockPattern[] | undefined;
	[ userPatternCategoriesSelectKey ]?: (
		select: typeof globalSelect
	) => UserPatternCategory[];
};

/**
 * A reference to the element that had focus when focus left the editor canvas.
 */
export interface LastFocus {
	current: HTMLElement | SVGElement | null;
}

export interface StyleOverride {
	clientId?: string;
	[ key: string ]: unknown;
}

/**
 * A block reduced to its client ID and the same shape for its inner blocks.
 */
export interface ClientIdsTreeNode {
	clientId: string;
	innerBlocks: ClientIdsTreeNode[];
}

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
	selectionStart: BlockSelection;
	selectionEnd: BlockSelection;
}

/**
 * A removal prompt message with an optional warning that the user must
 * confirm, as returned by the editor's removal rules.
 */
export interface RemovalPromptDetails {
	description: string;
	warning?: string;
	subtext?: string;
	requireConfirmation?: boolean;
}

export type RemovalPromptMessage = string | RemovalPromptDetails;

export interface BlockRemovalRule {
	postTypes?: string[];
	/**
	 * Returns the prompt message when removing the given flattened blocks
	 * needs confirmation, or nothing otherwise.
	 */
	callback: (
		blocks: Omit< TreeBlock, 'innerBlocks' >[]
	) => RemovalPromptMessage | undefined;
}

export interface RemovalPromptData {
	clientIds: string[];
	selectPrevious: boolean;
	message: RemovalPromptMessage;
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
	lastFocus: LastFocus | null | false;
	expandedBlock: string | null;
	highlightedBlock: string | null | undefined;
	lastBlockInserted: { clientIds?: string[]; source?: string };
	editedContentOnlySection: string | undefined;
	blockVisibility: Record< string, boolean >;
	viewportModalClientIds: string[] | null;
	styleOverrides: Map< unknown, StyleOverride >;
	removalPromptData: RemovalPromptData | false;
	blockRemovalRules: BlockRemovalRule[] | false;
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
	| { type: 'LAST_FOCUS'; lastFocus: LastFocus | null | false }
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
			rules: BlockRemovalRule[] | false;
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
	| { type: 'SET_STYLE_OVERRIDE'; id: unknown; style: StyleOverride }
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

/**
 * Thunk arguments for the block editor store, including private selectors
 * and actions.
 */
export type BlockEditorThunkArgs = ThunkArgs<
	typeof store,
	Omit< typeof privateSelectors, 'DEFAULT_BLOCK_STYLE_STATE' >,
	typeof privateActions
>;
