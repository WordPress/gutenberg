/*
 * The public props types that need adjusting: their source types include React's
 * `key` or `ref`, which the public props types leave out. `types.ts` lists and
 * documents them with the other public types.
 */
import type { BlockPopoverProps as BlockPopoverSourceProps } from './components/block-popover/types';
import type { FontSizePickerProps as FontSizePickerSourceProps } from './components/font-sizes/types';
import type { LineHeightControlProps as LineHeightControlSourceProps } from './components/line-height-control/types';
import type {
	RichTextProps as RichTextSourceProps,
	RichTextToolbarButtonProps as RichTextToolbarButtonSourceProps,
} from './components/rich-text/types';
import type { URLPopoverProps as URLPopoverSourceProps } from './components/url-popover/types';

/**
 * Leaves out React's `key` and `ref`. Distributes over union props, which `Omit`
 * would collapse to their common keys.
 */
type WithoutKeyAndRef< Props > = Props extends unknown
	? Omit< Props, 'key' | 'ref' >
	: never;

export type BlockPopoverProps = WithoutKeyAndRef< BlockPopoverSourceProps >;
export type FontSizePickerProps = WithoutKeyAndRef< FontSizePickerSourceProps >;
export type LineHeightControlProps =
	WithoutKeyAndRef< LineHeightControlSourceProps >;
export type RichTextProps = WithoutKeyAndRef< RichTextSourceProps >;
export type RichTextToolbarButtonProps =
	WithoutKeyAndRef< RichTextToolbarButtonSourceProps >;
export type URLPopoverProps = WithoutKeyAndRef< URLPopoverSourceProps >;
