import type { ComponentType } from 'react';
import type { BlockType } from '@wordpress/blocks';

/**
 * The viewport and pseudo state whose styles a block's controls edit.
 */
export interface BlockStyleState {
	viewport?: string;
	pseudo?: string;
}

/**
 * A block's `style` attribute, or a part of it.
 */
export type BlockStyle = Record< string, unknown >;

/**
 * A Tools Panel reset-all filter, returning the attributes to set.
 */
export type ResetAllFilter = ( attributes: {
	style?: BlockStyle;
} ) => ( Record< string, unknown > & { style?: BlockStyle } ) | undefined;

/**
 * Props a block support's controls receive: the block's identity and the
 * attributes the support reads.
 */
export interface BlockSupportEditProps {
	name: string;
	isSelected?: boolean;
	clientId: string;
	setAttributes: ( attributes: Record< string, unknown > ) => void;
	__unstableParentLayout?: unknown;
	[ attribute: string ]: unknown;
}

/**
 * Props the `editor.BlockEdit` filter passes to the block edit component.
 */
export interface BlockEditHookProps {
	name: string;
	attributes: Record< string, unknown >;
	isSelected?: boolean;
	clientId: string;
	setAttributes: ( attributes: Record< string, unknown > ) => void;
	__unstableParentLayout?: unknown;
}

/**
 * Props the `editor.BlockListBlock` filter passes to the block list block.
 */
export interface BlockListBlockHookProps {
	name: string;
	attributes: Record< string, unknown >;
	clientId: string;
	wrapperProps?: BlockWrapperProps;
}

/**
 * Props a block support adds to the block wrapper.
 */
export interface BlockWrapperProps {
	className?: string;
	style?: Record< string, unknown >;
	[ prop: string ]: unknown;
}

interface BlockSupportFeatureBase {
	hasSupport: ( nameOrType: string | BlockType ) => boolean;
	attributeKeys?: string[];
}

/**
 * A block support that renders controls for the block.
 */
export interface BlockEditFeature extends BlockSupportFeatureBase {
	edit: ComponentType< BlockSupportEditProps >;
	shareWithChildBlocks?: boolean;
	supportsPatternEditing?: boolean;
}

/**
 * A block support that adds props to the block wrapper in the editor.
 */
export interface BlockListBlockFeature extends BlockSupportFeatureBase {
	useBlockProps: (
		props: Record< string, unknown >
	) => BlockWrapperProps | undefined;
	isMatch?: ( attributes: Record< string, unknown > ) => boolean;
}

/**
 * A block support that adds props to the saved block markup.
 */
export interface BlockSaveFeature extends BlockSupportFeatureBase {
	addSaveProps: (
		props: Record< string, unknown >,
		blockType: BlockType,
		attributes: Record< string, unknown >
	) => Record< string, unknown >;
}

/**
 * A style override for the editor canvas: CSS or SVG assets, keyed by `id`.
 */
export interface StyleOverrideOptions {
	id?: string | null;
	css?: string;
	assets?: string;
	__unstableType?: string;
	variation?: unknown;
	clientId?: string;
}

/**
 * A value after `cleanEmptyObject`: plain objects lose their empty values, so
 * every key may be missing.
 */
export type CleanedObject< T > = T extends ( ...args: never[] ) => unknown
	? T
	: T extends unknown[]
		? T
		: T extends object
			? { [ K in keyof T ]?: CleanedObject< T[ K ] > }
			: T;
