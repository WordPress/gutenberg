import type {
	ComponentType,
	ElementType,
	ReactNode,
	Ref,
	RefCallback,
} from 'react';
import type { BlockType } from '@wordpress/blocks';
import type { Layout } from '../../layouts/types';
import type { UseBlockSyncProps } from '../provider/types';
import type { BlockTemplate } from '../../store/types';

/**
 * The block an appender inserts directly.
 */
export interface DirectInsertBlock {
	name: string;
	attributes?: Record< string, unknown >;
}

/**
 * Whether the appender inserts the default block directly. A function is
 * deprecated.
 */
export type DirectInsert = boolean | ( ( ...args: never[] ) => unknown );

/**
 * The inner blocks options of `useInnerBlocksProps` and the props of
 * `InnerBlocks`.
 */
export interface InnerBlocksOptions extends Pick<
	UseBlockSyncProps,
	'value' | 'onChange' | 'onInput'
> {
	/** Block names which are permitted in inner blocks. */
	allowedBlocks?: boolean | string[];
	/** Block names or variations to prioritize in the inserter. */
	prioritizedInserterBlocks?: string[];
	/** The default block to insert. */
	defaultBlock?: DirectInsertBlock;
	/** Whether a default block should be inserted directly by the appender. */
	directInsert?: DirectInsert;
	/** Deprecated, use `defaultBlock`. */
	__experimentalDefaultBlock?: DirectInsertBlock;
	/** Deprecated, use `directInsert`. */
	__experimentalDirectInsert?: DirectInsert;
	/** Deprecated, declare the template in the block type settings. */
	template?: BlockTemplate;
	/** The template lock of the inner blocks, e.g. `all`. */
	templateLock?: string | false;
	/** Deprecated, declare it in the block type settings. */
	templateInsertUpdatesSelection?: boolean;
	/** Whether the inner blocks show their toolbars on this block. */
	__experimentalCaptureToolbars?: boolean;
	__experimentalAppenderTagName?: ElementType;
	/** A custom appender, or `false` for none. */
	renderAppender?: ComponentType | false;
	/** The direction in which the inner blocks flow. */
	orientation?: 'horizontal' | 'vertical';
	/** Rendered when there are no inner blocks. */
	placeholder?: ReactNode;
	/** The layout of the inner blocks, overriding the block's own. */
	layout?: Layout;
	wrapperRef?: Ref< HTMLElement >;
	__unstableDisableLayoutClassNames?: boolean;
	__unstableDisableDropZone?: boolean;
	/** An element to use as the drop zone, in place of the wrapper. */
	dropZoneElement?: HTMLElement | null;
}

/**
 * The props of the inner blocks of a block: the options, plus what the hook
 * selects for the block.
 */
export interface InnerBlocksProps extends Omit< InnerBlocksOptions, 'layout' > {
	clientId: string;
	/** The layout of the inner blocks, or `null` for none. */
	layout?: Layout | null;
	name?: string | null;
	blockType?: BlockType;
	parentLock?: string | false;
	defaultLayout?: Layout;
}

/**
 * Props passed to `useInnerBlocksProps`, merged into the returned props.
 */
export type UseInnerBlocksPropsProps = Record< string, unknown > & {
	ref?: Ref< HTMLElement >;
	className?: string;
};

/**
 * Props to pass to the inner blocks wrapper element.
 */
export type UseInnerBlocksPropsResult = Record< string, unknown > & {
	ref: RefCallback< HTMLElement >;
	className: string;
	children: ReactNode;
};

export interface InnerBlocksButtonBlockAppenderProps {
	showSeparator?: boolean;
	isFloating?: boolean;
	onAddBlock?: () => void;
	isToggle?: boolean;
}
