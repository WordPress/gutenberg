import BlockVerticalAlignmentUI from './ui';
import type { BlockVerticalAlignmentControlProps } from './types';

const BlockVerticalAlignmentControl = (
	props: BlockVerticalAlignmentControlProps
) => {
	return <BlockVerticalAlignmentUI { ...props } isToolbar={ false } />;
};

const BlockVerticalAlignmentToolbar = (
	props: BlockVerticalAlignmentControlProps
) => {
	return <BlockVerticalAlignmentUI { ...props } isToolbar />;
};

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/block-vertical-alignment-control/README.md
 */
export { BlockVerticalAlignmentControl, BlockVerticalAlignmentToolbar };
