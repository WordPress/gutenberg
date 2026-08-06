/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Button, PanelBody } from '@wordpress/components';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import ReviewGroup from './review-group';
import {
	groupByUnit,
	useReviewData,
	useResolveReviewItems,
} from './review-data';

/**
 * Lists edits that were set aside for review after a sync conflict (open
 * proposals), with actions to restore the lost content as a new edit or
 * discard it. Resolving either way closes the proposal for every
 * collaborator.
 *
 * The panel is an index: conflicts anchored to a live block link to it (the
 * in-canvas marker is the primary resolution surface); conflicts whose
 * block no longer exists are only resolvable here.
 */
export default function CollaborationReviewPanel() {
	const { postType, postId, items, clientIdByTarget } = useReviewData();
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
					'This edit conflicted with a collaborator’s changes and was set aside. Restore it as a new edit or discard it.',
					'These edits conflicted with collaborators’ changes and were set aside. Restore them as new edits or discard them.',
					items.length
				) }
			</p>
			{ groups.map( ( groupItems ) => {
				const clientId = clientIdByTarget[ groupItems[ 0 ].targetId ];
				return (
					<ReviewGroup
						key={ groupItems[ 0 ].unitId }
						items={ groupItems }
						onResolve={ onResolve }
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
			{ groups.length > 1 && (
				<Button
					__next40pxDefaultSize
					className="editor-collaboration-review-panel__discard-all"
					variant="secondary"
					isDestructive
					onClick={ () => onResolve( items, 'dismissed' ) }
				>
					{ __( 'Discard all' ) }
				</Button>
			) }
		</PanelBody>
	);
}
