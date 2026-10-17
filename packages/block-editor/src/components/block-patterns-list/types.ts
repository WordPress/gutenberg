import type { ReactElement } from 'react';
import type { Block } from '@wordpress/blocks';
import type { BlockPattern } from '../../store/types';
import type { PaginationProps } from '../block-patterns-paging/types';

/**
 * A pattern in the list, with its parsed blocks.
 */
export interface BlockPatternsListPattern extends Pick<
	BlockPattern,
	'title' | 'description' | 'type' | 'syncStatus' | 'id'
> {
	name: string;
	blocks: Block[];
	viewportWidth?: number;
}

export type OnClickPattern = (
	pattern: BlockPatternsListPattern,
	blocks: Block[]
) => void;

export type OnHoverPattern = (
	pattern: BlockPatternsListPattern | null
) => void;

export interface WithToolTipProps {
	showTooltip?: boolean;
	title?: string;
	children: ReactElement< Record< string, unknown > >;
}

export interface BlockPatternProps {
	id: string;
	isDraggable?: boolean;
	pattern: BlockPatternsListPattern;
	onClick: OnClickPattern;
	onHover?: OnHoverPattern;
	showTitlesAsTooltip?: boolean;
	category?: string;
	isSelected?: boolean;
}

export interface BlockPatternsListProps {
	isDraggable?: boolean;
	blockPatterns: BlockPatternsListPattern[];
	onHover?: OnHoverPattern;
	onClickPattern: OnClickPattern;
	orientation?: 'horizontal' | 'vertical' | 'both';
	category?: string;
	label?: string;
	showTitlesAsTooltip?: boolean;
	pagingProps?: PaginationProps;
}
