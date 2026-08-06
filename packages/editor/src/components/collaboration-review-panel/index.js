/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Button, PanelBody } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const REASON_LABELS = {
	'frame-conflict': __( 'It conflicted with a collaborator’s change.' ),
	'dependent-on-escalated': __(
		'It depended on another edit that was set aside.'
	),
};

/**
 * Groups review items by their unit (a batch of edits made together), so a
 * burst of typing reads as one conflict with one set of actions.
 *
 * @param {Array} items Review items.
 *
 * @return {Array} Groups of items sharing a unitId.
 */
function groupByUnit( items ) {
	const groups = new Map();
	for ( const item of items ) {
		if ( ! groups.has( item.unitId ) ) {
			groups.set( item.unitId, [] );
		}
		groups.get( item.unitId ).push( item );
	}
	return Array.from( groups.values() );
}

function ReviewGroup( { items, onResolve } ) {
	const [ first ] = items;
	const attribution = first.isLocal
		? __( 'One of your edits was set aside.' )
		: __( 'A collaborator’s edit was set aside.' );
	const reason = REASON_LABELS[ first.reason ];
	const summaries = items
		.map( ( item ) => item.summary ?? item.excerpt )
		.filter( Boolean );

	return (
		<div className="editor-collaboration-review-panel__item">
			<p className="editor-collaboration-review-panel__attribution">
				{ attribution } { reason }
			</p>
			{ summaries.length > 0 && (
				<p className="editor-collaboration-review-panel__summary">
					{ sprintf(
						/* translators: %s: the content of the edit that was set aside. */
						__( 'Lost content: “%s”' ),
						summaries.join( ' ' )
					) }
				</p>
			) }
			<div className="editor-collaboration-review-panel__actions">
				<Button
					__next40pxDefaultSize
					size="compact"
					variant="secondary"
					onClick={ () => onResolve( items, 'restored' ) }
				>
					{ __( 'Restore' ) }
				</Button>
				<Button
					__next40pxDefaultSize
					size="compact"
					variant="tertiary"
					isDestructive
					onClick={ () => onResolve( items, 'dismissed' ) }
				>
					{ __( 'Discard' ) }
				</Button>
			</div>
		</div>
	);
}

/**
 * Lists edits that were set aside for review after a sync conflict (open
 * proposals), with actions to restore the lost content as a new edit or
 * discard it. Resolving either way closes the proposal for every
 * collaborator.
 */
export default function CollaborationReviewPanel() {
	const { postType, postId } = useSelect( ( select ) => {
		const { getCurrentPostType, getCurrentPostId } = select( editorStore );
		return {
			postType: getCurrentPostType(),
			postId: getCurrentPostId(),
		};
	}, [] );
	const items = useSelect(
		( select ) =>
			unlock( select( coreStore ) ).getSyncReviewItems(
				'postType',
				postType,
				postId
			),
		[ postType, postId ]
	);
	const { resolveSyncProposal, restoreSyncProposal } = unlock(
		useDispatch( coreStore )
	);

	const onResolve = useCallback(
		( groupItems, resolution ) => {
			for ( const item of groupItems ) {
				if ( 'restored' === resolution ) {
					restoreSyncProposal(
						'postType',
						postType,
						postId,
						item.id
					);
				} else {
					resolveSyncProposal(
						'postType',
						postType,
						postId,
						item.id,
						'dismissed'
					);
				}
			}
		},
		[ postType, postId, resolveSyncProposal, restoreSyncProposal ]
	);

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
			{ groups.map( ( groupItems ) => (
				<ReviewGroup
					key={ groupItems[ 0 ].unitId }
					items={ groupItems }
					onResolve={ onResolve }
				/>
			) ) }
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
