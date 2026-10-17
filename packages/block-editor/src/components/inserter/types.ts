import type { MouseEvent, ReactNode, RefObject } from 'react';
import type { Block, BlockCategory, BlockCollection } from '@wordpress/blocks';
import type { BlockPattern, InserterItem } from '../../store/types';

/**
 * Props the inserter passes to its toggle, or to `renderToggle`.
 */
export interface InserterToggleRenderProps {
	onToggle: ( event?: MouseEvent ) => void;
	disabled?: boolean;
	isOpen?: boolean;
	blockTitle: string;
	hasSingleBlockType?: boolean;
	appenderLabel?: string;
	toggleProps?: Record< string, unknown >;
}

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
 * Where the inserter inserts, and what it calls on insertion.
 */
export interface InserterConfig {
	/** If set, insertion will be into the block with this ID. */
	rootClientId?: string | null;
	/** If set, insertion will be into this explicit position. */
	insertionIndex?: number;
	/** If set, insertion will be after the block with this ID. */
	clientId?: string;
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
	BlockPattern[],
	PatternCategory[],
	OnClickPattern,
];

export interface PatternsPaging {
	totalItems: number;
	categoryPatterns: BlockPattern[];
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
	onInsert: InsertBlocks;
	rootClientId?: string | null;
	children?: ReactNode;
}

export interface PatternCategoryPreviewsProps {
	rootClientId?: string | null;
	onInsert: InsertBlocks;
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
