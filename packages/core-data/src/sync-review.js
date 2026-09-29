import { __, _n, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { STORE_NAME } from './name';
import { unlock } from './lock-unlock';

/**
 * Preserve conflict UI when record loading moves to the adapter.
 *
 * @param {import('./sync').CoreDataAccess} registry Store access.
 * @param {string}                          kind     Entity kind.
 * @param {string}                          name     Entity name.
 * @param {string|number}                   key      Record ID.
 * @return {Pick<import('@wordpress/sync').RecordHandlers, 'onEscalation' | 'onProposalsChange'>} Review callbacks.
 */
export function createSyncReviewHandlers( registry, kind, name, key ) {
	const dispatch = unlock( registry.dispatch( STORE_NAME ) );
	const AGGREGATE_NOTICE_THRESHOLD = 3;
	const escalationNoticeId = ( proposalId ) =>
		`core-data-sync-escalation-${ kind }-${ name }-${ key }-${ proposalId }`;
	const aggregateNoticeId = `core-data-sync-review-aggregate-${ kind }-${ name }-${ key }`;
	let aggregateNoticeActive = false;
	let knownProposalIds = [];
	return {
		onProposalsChange: ( items ) => {
			dispatch.setSyncReviewItems( kind, name, key, items );

			const notices = registry.dispatch( noticesStore );
			const openIds = new Set( items.map( ( item ) => item.id ) );
			const useAggregate = items.length > AGGREGATE_NOTICE_THRESHOLD;

			if ( useAggregate && ! aggregateNoticeActive ) {
				// Entering aggregate mode: sweep per-item
				// notices so they don't stack under the
				// counter notice.
				for ( const id of knownProposalIds ) {
					notices.removeNotice( escalationNoticeId( id ) );
				}
			}
			aggregateNoticeActive = useAggregate;

			if ( useAggregate ) {
				notices.createNotice(
					'warning',
					sprintf(
						/* translators: %d: number of edits set aside for review. */
						_n(
							'%d edit was set aside because of conflicting changes. Review it in the Collaboration panel of the document settings.',
							'%d edits were set aside because of conflicting changes. Review them in the Collaboration panel of the document settings.',
							items.length
						),
						items.length
					),
					{
						id: aggregateNoticeId,
						isDismissible: true,
					}
				);
			} else {
				notices.removeNotice( aggregateNoticeId );
				// Remove notices for proposals resolved
				// elsewhere (another collaborator, the review
				// panel, or another tab).
				for ( const id of knownProposalIds ) {
					if ( ! openIds.has( id ) ) {
						notices.removeNotice( escalationNoticeId( id ) );
					}
				}
			}

			knownProposalIds = items.map( ( item ) => item.id );
		},
		onEscalation: ( { isLocal, proposalId, summary } ) => {
			// While aggregated, the counter notice and the
			// review panel carry the information; skip the
			// per-item notice.
			if ( aggregateNoticeActive ) {
				return;
			}
			const base = isLocal
				? __(
						"One of your recent edits conflicted with a collaborator's change and was set aside."
					)
				: __(
						"A collaborator's edit conflicted with recent changes and was set aside."
					);
			const content = summary
				? sprintf(
						/* translators: 1: conflict description. 2: the lost content. */
						__( '%1$s Lost content: “%2$s”' ),
						base,
						summary
					)
				: base;
			const noticeId = escalationNoticeId( proposalId );
			const close = ( resolution ) => {
				if ( 'restored' === resolution ) {
					dispatch.restoreSyncProposal( kind, name, key, proposalId );
				} else {
					dispatch.resolveSyncProposal(
						kind,
						name,
						key,
						proposalId,
						'dismissed'
					);
				}
				registry.dispatch( noticesStore ).removeNotice( noticeId );
			};
			registry
				.dispatch( noticesStore )
				.createNotice( 'warning', content, {
					id: noticeId,
					isDismissible: true,
					actions: [
						{
							label: __( 'Restore' ),
							onClick: () => close( 'restored' ),
						},
						{
							label: __( 'Discard' ),
							onClick: () => close( 'dismissed' ),
						},
					],
				} );
		},
	};
}
