import BlockAlignmentUI from './ui';
import type { BlockAlignmentControlProps } from './types';

const BlockAlignmentControl = ( props: BlockAlignmentControlProps ) => {
	return <BlockAlignmentUI { ...props } isToolbar={ false } />;
};

const BlockAlignmentToolbar = ( props: BlockAlignmentControlProps ) => {
	return <BlockAlignmentUI { ...props } isToolbar />;
};

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/block-alignment-control/README.md
 */
export { BlockAlignmentControl, BlockAlignmentToolbar };
