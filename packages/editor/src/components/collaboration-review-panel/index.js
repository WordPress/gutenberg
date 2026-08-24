import { useDispatch } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { PanelBody } from '@wordpress/components';
import { store as blockEditorStore } from '@wordpress/block-editor';
import ReviewGroup from './review-group';
import {
	groupByUnit,
	itemAnchorClientId,
	useReviewData,
	useResolveReviewItems,
} from './review-data';

/**
 * A summary-only index of edits that were set aside for review after a
 * sync conflict (open proposals). Resolution happens at the inline block
 * card in the canvas — an anchored conflict here is a link that navigates
 * to its block. Only conflicts whose block no longer exists carry their
 * Adopt/Reject verbs in the panel, since they have no card to resolve at.
 */
export default function CollaborationReviewPanel() {
	const { postType, postId, items, clientIdByTarget, clientIdByIndex } =
		useReviewData();
	const onResolve = useResolveReviewItems( postType, postId );
	const { selectBlock, flashBlock } = useDispatch( blockEditorStore );

	if ( ! items.length ) {
		return null;
	}

	const groups = groupByUnit( items );

	return (
		<PanelBody
			title={ sprintf(
				/* translators: %d: number of conflicting edits awaiting review. */
				__( 'Collaboration conflicts (%d)' ),
				items.length
			) }
			className="editor-collaboration-review-panel"
			initialOpen
		>
			<p className="editor-collaboration-review-panel__description">
				{ _n(
					'This edit conflicted with a collaborator’s changes and was set aside. Review it at its block.',
					'These edits conflicted with collaborators’ changes and were set aside. Review them at their blocks.',
					items.length
				) }
			</p>
			{ groups.map( ( groupItems ) => {
				const clientId = itemAnchorClientId( groupItems[ 0 ], {
					clientIdByTarget,
					clientIdByIndex,
				} );
				return (
					<ReviewGroup
						key={ groupItems[ 0 ].unitId }
						items={ groupItems }
						onResolve={ onResolve }
						summaryOnly={ !! clientId }
						onNavigate={
							clientId
								? () => {
										// Selection scrolls the canvas to
										// the block; the flash points at it.
										selectBlock( clientId );
										flashBlock( clientId, 500 );
								  }
								: undefined
						}
					/>
				);
			} ) }
		</PanelBody>
	);
}
