import type { ComponentType } from 'react';
import type {
	Block,
	BlockAttribute,
	BlockType,
	ColorProps,
} from '@wordpress/blocks';
import type { BlockVisibility } from '../components/block-visibility/use-block-visibility';
import type { BlockEditorThunkArgs } from '../store/types';

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
 * The block a reset-all filter resets.
 */
export interface ResetAllContext {
	attributes: Record< string, unknown >;
	clientId: string;
	name: string | null;
}

/**
 * A Tools Panel reset-all filter, returning the attributes to set. The block
 * support tools panel passes the block context; state-scoped filters do not.
 */
export type ResetAllFilter = (
	attributes: {
		style?: BlockStyle;
	},
	context?: ResetAllContext
) => ( Record< string, unknown > & { style?: BlockStyle } ) | undefined;

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
 * The props `createBlockListBlockFilter` passes to `useBlockProps`: the block
 * name and client ID, plus the set attributes listed in `attributeKeys`.
 */
export interface BlockListBlockFeatureProps {
	name: string;
	clientId: string;
	[ attribute: string ]: unknown;
}

/**
 * A block support that adds props to the block wrapper in the editor.
 */
export interface BlockListBlockFeature extends BlockSupportFeatureBase {
	useBlockProps: (
		props: BlockListBlockFeatureProps
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

/**
 * A block's `color` support. Supports are read as declared, so a boolean
 * support reads like an object with no keys.
 */
export type ColorSupport = Partial< ColorProps > & { gradient?: boolean };

/**
 * A block's `__experimentalBorder` support, or `true` for all its features.
 */
export type BorderSupport = true | Record< string, unknown >;

/**
 * A block gap style: one value for both axes, or a `top` (row) and `left`
 * (column) value.
 */
export type BlockGapValue = string | { top?: string; left?: string };

/**
 * The `metadata` attribute every block gets.
 */
export interface BlockMetadata {
	name?: string;
	noteId?: unknown;
	blockVisibility?: BlockVisibility;
	[ key: string ]: unknown;
}

/**
 * A block whose `metadata` attribute is read.
 */
export type BlockWithMetadata = Block< { metadata?: BlockMetadata } >;

/**
 * The attributes the anchor support reads.
 */
export interface AnchorAttributes {
	anchor?: string;
}

/**
 * Props of the anchor control.
 */
export interface AnchorEditProps {
	anchor?: string;
	setAttributes: BlockSupportEditProps[ 'setAttributes' ];
}

/**
 * The attributes the custom class name support reads.
 */
export interface CustomClassNameAttributes {
	className?: string;
}

/**
 * Props of the custom class name control.
 */
export interface CustomClassNameEditProps {
	className?: string;
	setAttributes: BlockSupportEditProps[ 'setAttributes' ];
}

/**
 * A block whose `className` attribute is read.
 */
export type BlockWithClassName = Block< { className?: string } >;

/**
 * A block attribute that PHP marks for an auto-generated inspector control.
 */
export interface AutoGenerateAttribute extends BlockAttribute {
	autoGenerateControl?: boolean;
	label?: string;
	items?: Pick< BlockAttribute, 'type' | 'enum' >;
}

/**
 * Props of the auto-generated inspector controls.
 */
export interface AutoRegisterControlsProps {
	name: string;
	clientId: string;
	setAttributes: BlockSupportEditProps[ 'setAttributes' ];
}

/**
 * The section editing state of a block, and the actions that change it.
 */
export interface ContentOnlySectionEdit {
	isSectionBlock: boolean;
	isWithinSection: boolean;
	isWithinEditedSection: boolean;
	isEditingContentOnlySection: boolean;
	editedContentOnlySection: string | undefined;
	editContentOnlySection: BlockEditorThunkArgs[ 'dispatch' ][ 'editContentOnlySection' ];
	stopEditingContentOnlySection: BlockEditorThunkArgs[ 'dispatch' ][ 'stopEditingContentOnlySection' ];
}
