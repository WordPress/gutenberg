import AlignmentUI from './ui';
import type { AlignmentControlProps } from './types';

const AlignmentControl = ( props: AlignmentControlProps ) => {
	return <AlignmentUI { ...props } isToolbar={ false } />;
};

const AlignmentToolbar = ( props: AlignmentControlProps ) => {
	return <AlignmentUI { ...props } isToolbar />;
};

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/alignment-control/README.md
 */
export { AlignmentControl, AlignmentToolbar };
