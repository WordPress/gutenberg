/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { Notice } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import RevisionDiffPanel from '../revision-diff-panel';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

/**
 * Panel that shows changed block attributes for the selected block
 * when viewing revisions.
 */
export default function RevisionBlockDiffPanel() {
	const { block, currentRevisionId } = useSelect( ( select ) => {
		const { getSelectedBlock } = select( blockEditorStore );
		const { getCurrentRevisionId } = unlock( select( editorStore ) );

		return {
			block: getSelectedBlock(),
			currentRevisionId: getCurrentRevisionId(),
		};
	}, [] );

	if ( ! block ) {
		return null;
	}

	const diffStatus = block.attributes?.__revisionDiffStatus?.status;
	const changedAttributes =
		block.attributes?.__revisionDiffStatus?.changedAttributes;
	const isClassicBlockWithDiff =
		block.name === 'core/freeform' && !! diffStatus;
	const classicRevisionsUrl = currentRevisionId
		? addQueryArgs( 'revision.php', { revision: currentRevisionId } )
		: null;

	return (
		<>
			{ isClassicBlockWithDiff && (
				<Notice isDismissible={ false } status="warning">
					{ __(
						'Detailed inline changes are not available for Classic Block content in visual revisions. Use classic revisions for a full text diff.'
					) }{ ' ' }
					{ classicRevisionsUrl && (
						<a href={ classicRevisionsUrl }>
							{ __( 'Open classic revisions' ) }
						</a>
					) }
				</Notice>
			) }
			<RevisionDiffPanel
				title={ __( 'Changed attributes' ) }
				entries={ changedAttributes }
				initialOpen
			/>
		</>
	);
}
