import type { Block } from '@wordpress/blocks';
import type { BlockPattern } from '../../store/types';
import type { VIEWMODES } from './constants';

export type ViewMode = ( typeof VIEWMODES )[ keyof typeof VIEWMODES ];

/**
 * A pattern offered by the setup, with its parsed blocks.
 */
export type SetupPattern = BlockPattern & {
	blocks: Block[];
	viewportWidth?: number;
};

export type OnBlockPatternSelect = ( blocks: Block[] ) => void;

export interface BlockPatternSetupProps {
	clientId: string;
	blockName?: string | string[] | null;
	/** Filters the allowed patterns, in place of the block type ones. */
	filterPatternsFn?: ( pattern: BlockPattern ) => boolean;
	onBlockPatternSelect?: OnBlockPatternSelect;
	initialViewMode?: ViewMode;
	showTitles?: boolean;
}

export interface SetupContentProps {
	viewMode: ViewMode;
	activeSlide: number;
	patterns: SetupPattern[];
	onBlockPatternSelect: OnBlockPatternSelect;
	showTitles?: boolean;
}

export interface SetupPatternProps {
	pattern: SetupPattern;
	onSelect: OnBlockPatternSelect;
	showTitles?: boolean;
}

export interface BlockPatternSlideProps {
	active: boolean;
	className: string;
	pattern: SetupPattern;
	minHeight?: number;
}

export interface CarouselNavigationProps {
	handlePrevious: () => void;
	handleNext: () => void;
	activeSlide: number;
	totalSlides: number;
}

export interface SetupToolbarProps extends CarouselNavigationProps {
	viewMode: ViewMode;
	setViewMode: ( viewMode: ViewMode ) => void;
	onBlockPatternSelect: () => void;
}
