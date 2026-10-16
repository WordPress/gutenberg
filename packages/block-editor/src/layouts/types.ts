import type { BlockGapValue } from '../hooks/types';

/**
 * CSS rules for a selector within a layout. A `null` rule value takes the
 * block gap value.
 */
export interface LayoutStyle {
	selector: string;
	rules: Record< string, string | null >;
}

/**
 * The slugs, class name and styles of one layout type.
 */
export interface LayoutDefinition {
	name: string;
	slug: string;
	className: string;
	displayMode?: string;
	baseStyles?: LayoutStyle[];
	spacingStyles?: LayoutStyle[];
}

/**
 * A block's `layout` attribute or support.
 */
export interface Layout {
	type?: string;
	inherit?: boolean;
	contentSize?: string;
	wideSize?: string;
	alignments?: string[];
	[ key: string ]: unknown;
}

/**
 * The size hint shown for each alignment.
 */
export interface AlignmentsInfo {
	none?: string;
	wide?: string;
	[ alignment: string ]: string | undefined;
}

/**
 * An alignment a layout allows, with its size hint.
 */
export interface LayoutAlignment {
	name: string;
	info?: string;
}

/**
 * Arguments of a layout type's `getLayoutStyle`.
 */
export interface LayoutStyleArgs {
	selector: string;
	layout?: Layout;
	style?: { spacing?: { blockGap?: BlockGapValue } };
	blockName: string;
	hasBlockGapSupport?: boolean;
	layoutDefinitions?: Record< string, Partial< LayoutDefinition > > | null;
}
