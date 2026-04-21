/**
 * Internal dependencies
 */
import BlockAlignmentUI from './ui';

const BlockAlignmentControl = ( props ) => {
	return <BlockAlignmentUI { ...props } isToolbar={ false } />;
};

const BlockAlignmentToolbar = ( props ) => {
	return <BlockAlignmentUI { ...props } isToolbar />;
};

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/block-alignment-control/README.md
 */
export { BlockAlignmentControl, BlockAlignmentToolbar };
