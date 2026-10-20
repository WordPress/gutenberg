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

/**
 * The callbacks receive the pattern objects the list was given.
 */
export type OnClickPattern<
	P extends BlockPatternsListPattern = BlockPatternsListPattern,
> = ( pattern: P, blocks: Block[] ) => void;

export type OnHoverPattern<
	P extends BlockPatternsListPattern = BlockPatternsListPattern,
> = ( pattern: P | null ) => void;

export interface WithToolTipProps {
	showTooltip?: boolean;
	title?: string;
	children: ReactElement< Record< string, unknown > >;
}

export interface BlockPatternProps<
	P extends BlockPatternsListPattern = BlockPatternsListPattern,
> {
	id: string;
	isDraggable?: boolean;
	pattern: P;
	onClick: OnClickPattern< P >;
	onHover?: OnHoverPattern< P >;
	showTitlesAsTooltip?: boolean;
	category?: string;
	isSelected?: boolean;
}

export interface BlockPatternsListProps<
	P extends BlockPatternsListPattern = BlockPatternsListPattern,
> {
	isDraggable?: boolean;
	blockPatterns: Array< P >;
	onHover?: OnHoverPattern< P >;
	onClickPattern: OnClickPattern< P >;
	orientation?: 'horizontal' | 'vertical' | 'both';
	category?: string;
	label?: string;
	showTitlesAsTooltip?: boolean;
	pagingProps?: PaginationProps;
}
