/**
 * Internal dependencies
 */
import BlockVerticalAlignmentUI from './ui';

const BlockVerticalAlignmentControl = ( props ) => {
	return <BlockVerticalAlignmentUI { ...props } isToolbar={ false } />;
};

const BlockVerticalAlignmentToolbar = ( props ) => {
	return <BlockVerticalAlignmentUI { ...props } isToolbar />;
};

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/block-vertical-alignment-control/README.md
 */
export { BlockVerticalAlignmentControl, BlockVerticalAlignmentToolbar };
