/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import RevisionDiffPanel from '../revision-diff-panel';

/**
 * Panel that shows changed block attributes for the selected block
 * when viewing revisions.
 */
export default function RevisionBlockDiffPanel() {
	const { block } = useSelect( ( select ) => {
		const { getSelectedBlock } = select( blockEditorStore );
		return {
			block: getSelectedBlock(),
		};
	}, [] );

	if ( ! block ) {
		return null;
	}

	const changedAttributes =
		block.attributes?.__revisionDiffStatus?.changedAttributes;

	return (
		<RevisionDiffPanel
			title={ __( 'Changed attributes' ) }
			entries={ changedAttributes }
			initialOpen
		/>
	);
}
