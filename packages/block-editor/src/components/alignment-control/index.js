/**
 * Internal dependencies
 */
import AlignmentUI from './ui';
import { useBlockEditingMode } from '../block-editing-mode';

const AlignmentControl = ( props ) => {
	const blockEditingMode = useBlockEditingMode();

	if ( blockEditingMode !== 'default' ) {
		return;
	}

	return <AlignmentUI { ...props } isToolbar={ false } />;
};

const AlignmentToolbar = ( props ) => {
	return <AlignmentUI { ...props } isToolbar />;
};

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/alignment-control/README.md
 */
export { AlignmentControl, AlignmentToolbar };
