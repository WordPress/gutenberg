/**
 * Internal dependencies
 */
import AlignmentUI from './ui';

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/alignment-control/README.md
 */
export function AlignmentControl( props ) {
	return <AlignmentUI { ...props } isToolbar={ false } />;
}

export function AlignmentToolbar( props ) {
	return <AlignmentUI { ...props } isToolbar />;
}
