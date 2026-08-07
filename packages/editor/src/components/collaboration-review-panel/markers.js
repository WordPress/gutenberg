/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { caution } from '@wordpress/icons';
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import ReviewGroup from './review-group';
import {
	canRestoreItems,
	groupByUnit,
	useReviewData,
	useResolveReviewItems,
} from './review-data';

const { PrivateBlockPopover: BlockPopover } = unlock( blockEditorPrivateApis );

function ConflictMarker( { clientId, groups, onResolve, contentRef } ) {
	const [ isExpanded, setIsExpanded ] = useState( false );
	const count = groups.reduce( ( n, group ) => n + group.length, 0 );

	return (
		<BlockPopover
			clientId={ clientId }
			placement="top-end"
			focusOnMount={ false }
			className="editor-collaboration-conflict-marker"
			__unstableContentRef={ contentRef }
		>
			<Button
				__next40pxDefaultSize
				size="compact"
				icon={ caution }
				isPressed={ isExpanded }
				className="editor-collaboration-conflict-marker__chip"
				label={ sprintf(
					/* translators: %d: number of conflicting edits on this block. */
					_n(
						'%d edit on this block was set aside — review it',
						'%d edits on this block were set aside — review them',
						count
					),
					count
				) }
				showTooltip
				onClick={ () => setIsExpanded( ( value ) => ! value ) }
			>
				{ count > 1 ? count : undefined }
			</Button>
			{ isExpanded && (
				<div className="editor-collaboration-conflict-marker__card">
					{ groups.map( ( groupItems ) => (
						<ReviewGroup
							key={ groupItems[ 0 ].unitId }
							items={ groupItems }
							onResolve={ onResolve }
						/>
					) ) }
				</div>
			) }
		</BlockPopover>
	);
}

/**
 * An inline card for a parked NEW-block proposal, anchored where the block
 * would land. It shows who proposed it and the proposed content as inert
 * text (NEVER live DOM — the point of the approval gate is that this markup
 * has not been trusted), with Approve/Discard. Approve is reserved for
 * users who may publish it; others see why and can only Discard.
 */
/**
 * The content of an inline approval card (position-independent, so it can
 * be unit-tested without the block popover).
 *
 * @param {Object}   props
 * @param {Object}   props.item      The parked insertion review item.
 * @param {Function} props.onResolve ( items, resolution ) => void.
 */
export function InsertionCardBody( { item, onResolve } ) {
	const { blockType, html } = item.proposedInsertion;
	const restorable = canRestoreItems( [ item ] );

	return (
		<div className="editor-collaboration-insertion-card__body">
			<p className="editor-collaboration-insertion-card__attribution">
				{ item.isLocal
					? __( 'You proposed adding content that needs approval.' )
					: __(
							'A collaborator proposed adding content that needs approval.'
					  ) }
			</p>
			{ blockType && (
				<p className="editor-collaboration-insertion-card__type">
					{ blockType }
				</p>
			) }
			{ html && (
				// Inert text, never live DOM: the whole point of the
				// approval gate is that this markup has not been trusted.
				<pre className="editor-collaboration-insertion-card__preview">
					{ html }
				</pre>
			) }
			<div className="editor-collaboration-insertion-card__actions">
				{ restorable ? (
					<Button
						__next40pxDefaultSize
						size="compact"
						variant="primary"
						onClick={ () => onResolve( [ item ], 'restored' ) }
					>
						{ __( 'Approve' ) }
					</Button>
				) : (
					<span className="editor-collaboration-insertion-card__hint">
						{ __(
							'Only someone allowed to publish unfiltered HTML can approve this.'
						) }
					</span>
				) }
				<Button
					__next40pxDefaultSize
					size="compact"
					variant="tertiary"
					isDestructive
					onClick={ () => onResolve( [ item ], 'dismissed' ) }
				>
					{ __( 'Discard' ) }
				</Button>
			</div>
		</div>
	);
}

function InsertionCard( { clientId, placement, item, onResolve, contentRef } ) {
	return (
		<BlockPopover
			clientId={ clientId }
			placement={ placement }
			focusOnMount={ false }
			className="editor-collaboration-insertion-card"
			__unstableContentRef={ contentRef }
		>
			<InsertionCardBody item={ item } onResolve={ onResolve } />
		</BlockPopover>
	);
}

/**
 * In-canvas review surface: a badge on every block whose edits were set
 * aside (opening the conflict in place), plus an inline card for each
 * parked new-block proposal, anchored where the block would land. Both
 * complement the document-sidebar panel, which lists everything —
 * including conflicts whose block or anchor no longer exists.
 *
 * @param {Object} props
 * @param {Object} props.contentRef Ref to the editor content element, for
 *                                  popover scroll coupling.
 */
export default function CollaborationConflictMarkers( { contentRef } ) {
	const { postType, postId, items, clientIdByTarget } = useReviewData();
	const onResolve = useResolveReviewItems( postType, postId );
	const firstRootClientId = useSelect(
		( select ) => select( blockEditorStore ).getBlockOrder()[ 0 ] ?? null,
		[]
	);

	if ( ! items.length ) {
		return null;
	}

	// On-block conflicts: clientId → groups of items targeting it.
	const groupsByClientId = new Map();
	// Parked insertions get their own inline card, positioned relative to
	// their anchor sibling (or the top of the canvas).
	const insertions = [];
	for ( const group of groupByUnit( items ) ) {
		const [ first ] = group;
		if ( first.proposedInsertion ) {
			const anchorId =
				clientIdByTarget[ first.proposedInsertion.afterSiblingId ];
			if ( anchorId ) {
				insertions.push( {
					clientId: anchorId,
					placement: 'bottom-start',
					item: first,
				} );
			} else if (
				! first.proposedInsertion.afterSiblingId &&
				firstRootClientId
			) {
				// Insert-at-top with a non-empty canvas.
				insertions.push( {
					clientId: firstRootClientId,
					placement: 'top-start',
					item: first,
				} );
			}
			// Anchor gone (or empty canvas): the sidebar panel covers it.
			continue;
		}
		const clientId = clientIdByTarget[ first.targetId ];
		if ( ! clientId ) {
			continue;
		}
		if ( ! groupsByClientId.has( clientId ) ) {
			groupsByClientId.set( clientId, [] );
		}
		groupsByClientId.get( clientId ).push( group );
	}

	return (
		<>
			{ Array.from( groupsByClientId.entries() ).map(
				( [ clientId, groups ] ) => (
					<ConflictMarker
						key={ clientId }
						clientId={ clientId }
						groups={ groups }
						onResolve={ onResolve }
						contentRef={ contentRef }
					/>
				)
			) }
			{ insertions.map( ( insertion ) => (
				<InsertionCard
					key={ insertion.item.id }
					clientId={ insertion.clientId }
					placement={ insertion.placement }
					item={ insertion.item }
					onResolve={ onResolve }
					contentRef={ contentRef }
				/>
			) ) }
		</>
	);
}
