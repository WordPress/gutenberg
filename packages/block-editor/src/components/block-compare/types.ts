import type { MouseEventHandler, ReactNode } from 'react';
import type { Block } from '@wordpress/blocks';

/**
 * The block or blocks a convertor returns.
 */
export type ConvertedBlocks = Block | Block[];

/**
 * A block that failed validation, with the markup it was parsed from.
 */
export type InvalidBlock = Block & { originalContent: string };

export interface BlockCompareProps {
	/** The original object to compare against. */
	block: InvalidBlock;
	/**
	 * A function that returns a new, converted, block when supplied an
	 * existing block. The conversion may fix or alter the block in a way that
	 * helps with an invalid block.
	 */
	convertor: ( block: Block ) => ConvertedBlocks;
	/** Text to show in the convert button. */
	convertButtonText: string;
	/** Callback when the original block is required. */
	onKeep: MouseEventHandler< HTMLButtonElement >;
	/** Callback when the converted block is required. */
	onConvert: MouseEventHandler< HTMLButtonElement >;
}

export interface BlockViewProps {
	/** Heading of the column. */
	title: string;
	/** Markup shown as text, or its diff. */
	rawContent: ReactNode;
	/** Markup rendered as the preview. */
	renderedContent: string;
	/** Called when the action button is clicked. */
	action: MouseEventHandler< HTMLButtonElement >;
	/** Text of the action button. */
	actionText: string;
	/** Class name of the column. */
	className: string;
}
