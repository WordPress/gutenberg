import type {
	ComponentProps,
	ElementType,
	MouseEvent,
	MouseEventHandler,
	ReactNode,
	RefObject,
} from 'react';
import type {
	Block,
	BlockCategory,
	BlockCollection,
	BlockTypeIconRender,
} from '@wordpress/blocks';
import type { Popover } from '@wordpress/components';
import type {
	BlockPattern,
	InserterItem,
	ParsedBlockPattern,
} from '../../store/types';

/**
 * Props the inserter passes to its toggle, or to `renderToggle`.
 */
export interface InserterToggleRenderProps {
	onToggle: ( event?: MouseEvent ) => void;
	disabled?: boolean;
	isOpen?: boolean;
	blockTitle: string;
	hasSingleBlockType?: boolean;
	appenderLabel?: string | null;
	toggleProps?: InserterToggleProps;
}

/**
 * Props the inserter passes on to its toggle button.
 */
export type InserterToggleProps = Record< string, unknown > & {
	as?: ElementType;
	label?: string;
	/** The toggle passes its click event on, whichever element `as` renders. */
	onClick?: MouseEventHandler< HTMLElement >;
};

/**
 * A pattern category of the inserter.
 */
export interface PatternCategory {
	name: string;
	label: string;
	description?: string;
}

/**
 * Inserts blocks from the inserter.
 */
export type InsertBlocks = (
	blocks: Block | Block[],
	meta?: Record< string, unknown > | null,
	shouldForceFocusBlock?: boolean,
	rootClientId?: string | null
) => void;

/**
 * Inserts the blocks of a pattern. The menu wraps the pattern name into the
 * insertion meta.
 */
export type InsertPattern = (
	blocks: Block[],
	patternName: string,
	shouldForceFocusBlock?: boolean,
	rootClientId?: string | null
) => void;

/**
 * Where the inserter inserts, and what it calls on insertion.
 */
export interface InserterConfig {
	/** If set, insertion will be into the block with this ID. */
	rootClientId?: string | null;
	/** If set, insertion will be into this explicit position. */
	insertionIndex?: number;
	/** If set, insertion will be after the block with this ID. */
	clientId?: string | null;
	/** Whether the inserter is an appender or not. */
	isAppender?: boolean;
	/** Called after insertion. */
	onSelect?: ( blocks: Block | Block[] ) => void;
	shouldFocusBlock?: boolean;
	selectBlockOnInsert?: boolean;
}

/**
 * Selects an inserter item, and whether to focus the inserted block.
 */
export type OnSelectInserterItem = (
	item: InserterItem,
	shouldFocusBlock?: boolean
) => void;

export type BlockTypesState = [
	InserterItem[],
	BlockCategory[],
	Record< string, BlockCollection >,
	OnSelectInserterItem,
];

/**
 * Inserts the blocks of a pattern.
 */
export type OnClickPattern = (
	pattern: BlockPattern,
	blocks?: Block[]
) => void;

export type PatternsState = [
	Array< ParsedBlockPattern >,
	PatternCategory[],
	OnClickPattern,
];

export interface PatternsPaging {
	totalItems: number;
	categoryPatterns: Array< ParsedBlockPattern >;
	numPages: number;
	changePage: ( page: number ) => void;
	currentPage: number;
}

export type PatternsScrollContainerRef = RefObject< HTMLElement | null >;

/**
 * A category the inserter tabs and navigation list.
 */
export interface InserterTabCategory {
	name: string;
	label?: ReactNode;
}

export interface CategoryTabsProps< T extends InserterTabCategory > {
	categories: T[];
	selectedCategory?: T | null;
	onSelectCategory: ( category: T | undefined ) => void;
	children?: ReactNode;
}

export interface MobileTabNavigationProps< T extends InserterTabCategory > {
	categories: T[];
	children: ( category: T ) => ReactNode;
	screenClassName?: string;
}

export interface BlockPatternsTabProps {
	onSelectCategory: ( category: PatternCategory | undefined ) => void;
	selectedCategory?: PatternCategory | null;
	onInsert: InsertPattern;
	rootClientId?: string | null;
	children?: ReactNode;
}

export interface PatternCategoryPreviewsProps {
	rootClientId?: string | null;
	onInsert: InsertPattern;
	onHover?: ( pattern: BlockPattern | null ) => void;
	category: PatternCategory;
	showTitlesAsTooltip?: boolean;
}

export interface PatternsFilterProps {
	setPatternSyncFilter: ( value: string ) => void;
	setPatternSourceFilter: ( value: string ) => void;
	setPatternAuthorFilter: ( value: string ) => void;
	patternSyncFilter: string;
	patternSourceFilter: string;
	patternAuthorFilter: string;
	scrollContainerRef: PatternsScrollContainerRef;
	category: PatternCategory;
}

export interface PatternsExplorerProps {
	initialCategory?: PatternCategory | null;
	rootClientId?: string | null;
	onModalClose: () => void;
	patternCategories?: PatternCategory[];
}

export interface PatternExplorerSidebarProps {
	patternCategories: PatternCategory[];
	searchValue: string;
	setSearchValue: ( value: string ) => void;
}

export interface PatternListProps {
	searchValue: string;
	selectedCategory: string;
	patternCategories: PatternCategory[];
	rootClientId?: string | null;
	onModalClose: () => void;
}

export interface InserterPanelProps {
	title?: ReactNode;
	icon?: BlockTypeIconRender;
	children?: ReactNode;
}

export interface BlockTypesTabPanelProps {
	items: InserterItem[];
	collections: Record< string, BlockCollection >;
	categories: BlockCategory[];
	onSelectItem: OnSelectInserterItem;
	onHover: ( item: InserterItem | null ) => void;
	showMostUsedBlocks?: boolean;
	className?: string;
}

export interface BlockTypesTabProps {
	rootClientId?: string | null;
	onInsert: InsertBlocks;
	onHover: ( item: InserterItem | null ) => void;
	showMostUsedBlocks?: boolean;
}

export interface InserterSearchResultsProps {
	filterValue: string;
	onSelect?: InserterConfig[ 'onSelect' ];
	onHover?: ( item: InserterItem | null ) => void;
	onHoverPattern?: ( pattern: BlockPattern | null ) => void;
	rootClientId?: string | null;
	clientId?: string | null;
	isAppender?: boolean;
	__experimentalInsertionIndex?: number;
	maxBlockPatterns?: number;
	maxBlockTypes?: number;
	showBlockDirectory?: boolean;
	isDraggable?: boolean;
	shouldFocusBlock?: boolean;
	prioritizePatterns?: boolean;
	selectBlockOnInsert?: boolean;
	isQuick?: boolean;
}

export interface InserterMenuProps {
	rootClientId?: string | null;
	clientId?: string | null;
	isAppender?: boolean;
	__experimentalInsertionIndex?: number;
	onSelect: ( blocks?: Block | Block[] ) => void;
	showInserterHelpPanel?: boolean;
	showMostUsedBlocks?: boolean;
	__experimentalFilterValue?: string;
	shouldFocusBlock?: boolean;
	onPatternCategorySelection?: () => void;
	onClose?: () => void;
	__experimentalInitialTab?: string;
	__experimentalInitialCategory?: PatternCategory | null;
}

export type InserterLibraryProps = Omit< InserterMenuProps, 'onSelect' > & {
	onSelect?: InserterMenuProps[ 'onSelect' ];
};

export interface QuickInserterProps {
	onSelect?: InserterConfig[ 'onSelect' ];
	rootClientId?: string | null;
	clientId?: string | null;
	isAppender?: boolean;
	selectBlockOnInsert?: boolean;
	hasSearch?: boolean;
}

export interface InserterProps {
	clientId?: string | null;
	rootClientId?: string | null;
	disabled?: boolean;
	isAppender?: boolean;
	position?: ComponentProps< typeof Popover >[ 'position' ];
	selectBlockOnInsert?: boolean;
	shouldDirectInsert?: boolean;
	showInserterHelpPanel?: boolean;
	__experimentalIsQuick?: boolean;
	/** Called with the inserted block, or with nothing on close. */
	onSelectOrClose?: ( block?: Block ) => void;
	onToggle?: ( isOpen: boolean ) => void;
	renderToggle?: ( props: InserterToggleRenderProps ) => ReactNode;
	toggleProps?: InserterToggleProps;
}
