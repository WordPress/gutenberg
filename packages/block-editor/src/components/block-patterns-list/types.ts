import type { ReactElement } from 'react';
import type { Block } from '@wordpress/blocks';
import type { BlockPattern } from '../../store/types';
import type { PaginationProps } from '../block-patterns-paging/types';

/**
 * A listed pattern, which comes with its parsed blocks.
 */
export type BlockPatternsListPattern = BlockPattern & {
	blocks: Block[];
	viewportWidth?: number;
};

export type OnClickPattern = ( pattern: BlockPattern, blocks: Block[] ) => void;

export type OnHoverPattern = ( pattern: BlockPattern | null ) => void;

export interface WithToolTipProps {
	showTooltip?: boolean;
	title?: string;
	children: ReactElement< Record< string, unknown > >;
}

export interface BlockPatternProps {
	id: string;
	isDraggable?: boolean;
	pattern: BlockPattern;
	onClick: OnClickPattern;
	onHover?: OnHoverPattern;
	showTitlesAsTooltip?: boolean;
	category?: string;
	isSelected?: boolean;
}

export interface BlockPatternsListProps {
	isDraggable?: boolean;
	blockPatterns: BlockPattern[];
	onHover?: OnHoverPattern;
	onClickPattern: OnClickPattern;
	orientation?: 'horizontal' | 'vertical' | 'both';
	category?: string;
	label?: string;
	showTitlesAsTooltip?: boolean;
	pagingProps?: PaginationProps;
}
