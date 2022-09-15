/**
 * Internal dependencies
 */
import AlignmentUI from './ui';

const AlignmentControl = ( props ) => {
	return <AlignmentUI { ...props } isToolbar={ false } />;
};

const AlignmentToolbar = ( props ) => {
	return <AlignmentUI { ...props } isToolbar />;
};

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/alignment-control/README.md
 */
export { AlignmentControl, AlignmentToolbar };
