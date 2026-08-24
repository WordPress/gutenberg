/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

export const REASON_LABELS = {
	'frame-conflict': __( 'It conflicted with a collaborator’s change.' ),
	'dependent-on-escalated': __(
		'It depended on another edit that was set aside.'
	),
	'requires-approval': __(
		'It contains content that needs approval from someone allowed to publish unfiltered HTML.'
	),
};

/**
 * Whether the current user may restore a group of review items. Restoring
 * a requires-approval conflict IS the approval (the content re-publishes
 * under the restorer's account), so it is reserved for users who can
 * publish unfiltered HTML. UI hint only — ingest re-enforces per the
 * authoring user's capability regardless.
 *
 * @param {Array} items The group's review items.
 * @return {boolean} Whether restore is available.
 */
export function canRestoreItems( items ) {
	return (
		items.every( ( item ) => 'requires-approval' !== item.reason ) ||
		false !== window._wpCollaborationCanUnfilteredHtml
	);
}

const EMPTY_CLIENT_IDS = {};

/**
 * Groups review items by their unit (a batch of edits made together), so a
 * burst of typing reads as one conflict with one set of actions.
 *
 * @param {Array} items Review items.
 *
 * @return {Array} Groups of items sharing a unitId.
 */
export function groupByUnit( items ) {
	const groups = new Map();
	for ( const item of items ) {
		if ( ! groups.has( item.unitId ) ) {
			groups.set( item.unitId, [] );
		}
		groups.get( item.unitId ).push( item );
	}
	return Array.from( groups.values() );
}

/**
 * The clientId a review item anchors to in the canvas, or undefined for an
 * unanchored item (its block no longer exists, or it targets no block).
 * Identity (`targetId`/syncId) wins over the positional `targetIndex`
 * fallback used by engines that address blocks by top-level index.
 *
 * @param {Object} item                  Review item.
 * @param {Object} maps                  The maps returned by useReviewData.
 * @param {Object} maps.clientIdByTarget syncId → clientId.
 * @param {Object} maps.clientIdByIndex  Top-level block index → clientId.
 * @return {string|undefined} Anchor clientId.
 */
export function itemAnchorClientId(
	item,
	{ clientIdByTarget, clientIdByIndex }
) {
	if ( item.targetId ) {
		return clientIdByTarget[ item.targetId ];
	}
	if ( undefined !== item.targetIndex ) {
		return clientIdByIndex[ item.targetIndex ];
	}
	return undefined;
}

/**
 * The current post's sync review state: open review items, and a map from
 * each item's target block identity (syncId) to the block's clientId in the
 * editor, for anchoring conflicts to canvas blocks. Targets whose block no
 * longer exists are absent from the map. `clientIdByIndex` maps top-level
 * block indexes to clientIds for positionally-addressed items
 * (`targetIndex`).
 *
 * @return {Object} { postType, postId, items, clientIdByTarget, clientIdByIndex }.
 */
export function useReviewData() {
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
	const clientIdByTarget = useSelect(
		( select ) => {
			// Resolve both on-block conflict targets AND the anchor sibling
			// of parked insertions (so an inline approval card can position
			// itself where the proposed block would land).
			const targetIds = items
				.flatMap( ( item ) => [
					item.targetId,
					item.proposedInsertion?.afterSiblingId,
				] )
				.filter( Boolean );
			if ( ! targetIds.length ) {
				return EMPTY_CLIENT_IDS;
			}
			const { getClientIdsWithDescendants, getBlockAttributes } =
				select( blockEditorStore );
			const wanted = new Set( targetIds );
			const map = {};
			for ( const clientId of getClientIdsWithDescendants() ) {
				const syncId = getBlockAttributes( clientId )?.metadata?.syncId;
				if ( syncId && wanted.has( syncId ) ) {
					map[ syncId ] = clientId;
				}
			}
			return map;
		},
		[ items ]
	);
	const clientIdByIndex = useSelect(
		( select ) => {
			const indexes = items
				.map( ( item ) => item.targetIndex )
				.filter( ( index ) => undefined !== index );
			if ( ! indexes.length ) {
				return EMPTY_CLIENT_IDS;
			}
			const order = select( blockEditorStore ).getBlockOrder();
			const map = {};
			for ( const index of indexes ) {
				if ( order[ index ] ) {
					map[ index ] = order[ index ];
				}
			}
			return map;
		},
		[ items ]
	);

	return { postType, postId, items, clientIdByTarget, clientIdByIndex };
}

/**
 * Returns a callback resolving a group of review items: 'restored'
 * re-authors each item's lost content as an ordinary edit, 'dismissed'
 * discards it. Either way the proposals close for every collaborator.
 *
 * @param {string}        postType Current post type.
 * @param {string|number} postId   Current post ID.
 *
 * @return {Function} ( items, resolution ) => void.
 */
export function useResolveReviewItems( postType, postId ) {
	const { resolveSyncProposal, restoreSyncProposal } = unlock(
		useDispatch( coreStore )
	);

	return useCallback(
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
}
