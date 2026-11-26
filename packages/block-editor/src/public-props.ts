/*
 * The public props types that need adjusting: their source types include React's
 * `key` or `ref`, which the public props types leave out. `types.ts` lists and
 * documents them with the other public types.
 */
import type { DistributiveOmit } from '@wordpress/components';
import type { BlockPopoverProps as BlockPopoverSourceProps } from './components/block-popover/types';
import type { FontSizePickerProps as FontSizePickerSourceProps } from './components/font-sizes/types';
import type { LineHeightControlProps as LineHeightControlSourceProps } from './components/line-height-control/types';
import type {
	RichTextFieldValue,
	RichTextProps as RichTextSourceProps,
	RichTextToolbarButtonProps as RichTextToolbarButtonSourceProps,
} from './components/rich-text/types';
import type { URLPopoverProps as URLPopoverSourceProps } from './components/url-popover/types';

export type BlockPopoverProps = DistributiveOmit<
	BlockPopoverSourceProps,
	'key' | 'ref'
>;
export type FontSizePickerProps = DistributiveOmit<
	FontSizePickerSourceProps,
	'key' | 'ref'
>;
export type LineHeightControlProps = DistributiveOmit<
	LineHeightControlSourceProps,
	'key' | 'ref'
>;
export type RichTextProps< V extends RichTextFieldValue = RichTextFieldValue > =
	DistributiveOmit< RichTextSourceProps< V >, 'key' | 'ref' >;
export type RichTextToolbarButtonProps = DistributiveOmit<
	RichTextToolbarButtonSourceProps,
	'key' | 'ref'
>;
export type URLPopoverProps = DistributiveOmit<
	URLPopoverSourceProps,
	'key' | 'ref'
>;
