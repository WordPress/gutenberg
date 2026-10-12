import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import RevisionDiffPanel from '../revision-diff-panel';
import ImageRevisionComparison from '../post-revisions-preview/image-comparison';

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
	const imageComparison =
		block.attributes?.__revisionDiffStatus?.imageComparison;

	return (
		<>
			{ imageComparison && (
				<ImageRevisionComparison
					key="image-comparison"
					{ ...imageComparison }
				/>
			) }
			<RevisionDiffPanel
				title={ __( 'Changed attributes' ) }
				entries={ changedAttributes }
				initialOpen
			/>
		</>
	);
}
