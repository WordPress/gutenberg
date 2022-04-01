/**
 * Internal dependencies
 */
import BlockVerticalAlignmentUI from './ui';

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/block-vertical-alignment-control/README.md
 */
export function BlockVerticalAlignmentControl( props ) {
	return <BlockVerticalAlignmentUI { ...props } isToolbar={ false } />;
}

export function BlockVerticalAlignmentToolbar( props ) {
	return <BlockVerticalAlignmentUI { ...props } isToolbar />;
}
