/**
 * Internal dependencies
 */
import BlockAlignmentUI from './ui';

export function BlockAlignmentControl( props ) {
	return <BlockAlignmentUI { ...props } isToolbar={ false } />;
}

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/block-alignment-control/README.md
 */
export function BlockAlignmentToolbar( props ) {
	return <BlockAlignmentUI { ...props } isToolbar />;
}
