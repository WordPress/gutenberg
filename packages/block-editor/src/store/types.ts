// types.ts
import type { SETTINGS_DEFAULTS } from './defaults';
import type {
	selectBlockPatternsKey,
	reusableBlocksSelectKey,
	userPatternCategoriesSelectKey,
	sectionRootClientIdKey,
	isIsolatedEditorKey,
	deviceTypeKey,
} from './private-keys';
import type { Block } from '@wordpress/blocks';

// ─── Sub-state shapes ────────────────────────────────────────────────────────

export interface BlockWithoutAttributes {
	clientId: string;
	name: string;
	isValid: boolean;
}

export interface BlockTreeEntry {
	clientId: string;
	innerBlocks: BlockTreeEntry[];
	[ key: string ]: unknown;
}

export interface BlocksState {
	byClientId: Map< string, BlockWithoutAttributes >;
	attributes: Map< string, Record< string, unknown > >;
	order: Map< string, string[] >;
	parents: Map< string, string >;
	tree: Map< string, BlockTreeEntry >;
	controlledInnerBlocks: Set< string >;
	blockEditingModes: Map< string, BlockEditingMode >;
	isPersistentChange: boolean;
	isIgnoredChange: boolean;
}

export interface SelectionState {
	selectionStart: SelectionPoint;
	selectionEnd: SelectionPoint;
}

export interface SelectionPoint {
	clientId?: string;
	attributeKey?: string;
	offset?: number;
}

export interface InsertionPoint {
	rootClientId: string;
	index: number;
	[ key: string ]: unknown;
}

export interface TemplateState {
	isValid: boolean;
	[ key: string ]: unknown;
}

export interface LastBlockInserted {
	clientIds?: string[];
	method?: string;
	source?: string;
}

export interface StyleOverride {
	clientId: string;
	css: string;
	[ key: string ]: unknown;
}

export interface OpenedListViewPanels {
	allOpen?: boolean;
	panels?: Record< string, boolean >;
}

export interface SelectedBlockStyleState {
	clientId: string;
	value?: {
		viewport?: string;
		pseudo?: string;
	};
	showStateOnCanvas?: boolean;
}

export interface RequestedInspectorTab {
	tabName: string;
	[ key: string ]: unknown;
}

export interface InserterMediaCategory {
	name: string;
	mediaType: string;
	[ key: string ]: unknown;
}
export interface ClientIdTree {
	clientId: string;
	innerBlocks: ClientIdTree[];
}

export interface BlockListSettings {
	allowedBlocks?: string[] | false;
	templateLock?: 'all' | 'insert' | 'contentOnly' | false;
	[ key: string ]: unknown;
}
export type BlockEditingMode = 'default' | 'disabled' | 'contentOnly';

export type ZoomLevel = number | 'auto-scaled';

// ─── Settings shape ──────────────────────────────────────────────────────────

export type EditorSettings = typeof SETTINGS_DEFAULTS & {
	__experimentalBlockPatterns?: unknown[];
	__experimentalBlockPatternCategories?: unknown[];
	__experimentalUserPatternCategories?: Array< {
		id: number;
		slug: string;
		name: string;
	} >;
	__experimentalReusableBlocks?: unknown[];
	__experimentalCreatePageEntity?: ( options: {
		title: string;
		status: string;
	} ) => Promise< {
		id: number;
		type: string;
		title: { rendered: string };
		link: string;
	} >;
	__experimentalUserCanCreatePages?: boolean;
	templateLock?: 'all' | 'insert' | 'contentOnly' | false;
	inserterMediaCategories?: InserterMediaCategory[];
	disableContentOnlyForUnsyncedPatterns?: boolean;
	disableContentOnlyForTemplateParts?: boolean;
	// Symbol-keyed settings — typed via index signature workaround
	[ selectBlockPatternsKey ]?: ( select: unknown ) => unknown[];
	[ reusableBlocksSelectKey ]?: ( select: unknown ) => unknown[];
	[ userPatternCategoriesSelectKey ]?: (
		select: unknown
	) => Array< { id: number; slug: string; name: string } >;
	[ sectionRootClientIdKey ]?: string;
	[ isIsolatedEditorKey ]?: boolean;
	[ deviceTypeKey ]?: string;
	[ key: string ]: unknown;
};

// ─── Root State ──────────────────────────────────────────────────────────────

export interface State {
	blocks: BlocksState;
	isDragging: boolean;
	isTyping: boolean;
	isBlockInterfaceHidden: boolean;
	draggedBlocks: string[];
	selection: SelectionState;
	isMultiSelecting: boolean;
	isSelectionEnabled: boolean;
	initialPosition: SelectionPoint | null;
	blocksMode: Record< string, 'visual' | 'html' >;
	blockListSettings: Map< string, Record< string, unknown > >;
	insertionPoint: InsertionPoint | null;
	insertionCue: unknown;
	template: TemplateState | null;
	settings: EditorSettings;
	preferences: {
		insertUsage: Record< string, unknown >;
	};
	lastBlockAttributesChange: {
		clientId: string;
		attributes: Record< string, unknown >;
	} | null;
	lastFocus: Element | null;
	expandedBlock: string | null;
	highlightedBlock: string | null;
	lastBlockInserted: LastBlockInserted;
	editedContentOnlySection: string | null;
	blockVisibility: Record< string, unknown >;
	viewportModalClientIds: string[] | null;
	styleOverrides: Map< string, StyleOverride >;
	removalPromptData: unknown | false;
	blockRemovalRules: unknown | false;
	registeredInserterMediaCategories: Array< {
		name: string;
		mediaType: string;
		[ key: string ]: unknown;
	} >;
	zoomLevel: ZoomLevel;
	hasBlockSpotlight: boolean;
	openedListViewPanels: OpenedListViewPanels;
	listViewExpandRevision: number;
	listViewContentPanelOpen: boolean;
	requestedInspectorTab: RequestedInspectorTab | null;
	selectedBlockStyleState: SelectedBlockStyleState | null;
	styleStateViewport: string;
	isResponsiveEditing: boolean;
	// Derived state (added by pipe transforms after combineReducers)
	derivedBlockEditingModes?: Map< string, BlockEditingMode >;
	blockPatterns?: unknown[];
}

export interface BlockLock {
	move?: boolean;
	remove?: boolean;
	edit?: boolean;
}

export interface BlockMetadata {
	name?: string;
	categories?: string[];
	patternName?: string;
	patternCategories?: string[];
	blockVisibility?:
		| false
		| {
				viewport?: Record< string, boolean >;
		  };
	[ key: string ]: unknown;
}

export interface BlockAttributes {
	lock?: BlockLock;
	metadata?: BlockMetadata;
	[ key: string ]: unknown;
}

export interface UserPattern {
	id: number;
	title?: { raw?: string };
	wp_pattern_category?: number[];
	content?: { raw?: string };
	wp_pattern_sync_status?: string;
}

export interface UserPatternCategory {
	id: number;
	slug: string;
	name: string;
}

export interface Pattern {
	name: string;
	id?: number;
	type?: string;
	title?: string;
	categories?: string[];
	content?: string;
	syncStatus?: string;
	inserter?: boolean;
	blocks?: Block[];
	[ key: string ]: unknown;
}

export interface GrammarBlock {
	blockName: string | null;
	name: string | Record< string, unknown >;
	attrs: Record< string, unknown >;
	innerBlocks: GrammarBlock[];
	innerHTML: string;
	innerContent: Array< string | null >;
}
