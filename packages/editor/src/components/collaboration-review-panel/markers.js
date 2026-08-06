/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { _n, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { caution } from '@wordpress/icons';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import ReviewGroup from './review-group';
import {
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
 * In-canvas conflict markers: for every block with edits set aside for
 * review, a badge anchored to the block opens the conflicts in context with
 * Restore/Discard actions. Conflicts whose block no longer exists are only
 * listed in the document sidebar's review panel.
 *
 * @param {Object} props
 * @param {Object} props.contentRef Ref to the editor content element, for
 *                                  popover scroll coupling.
 */
export default function CollaborationConflictMarkers( { contentRef } ) {
	const { postType, postId, items, clientIdByTarget } = useReviewData();
	const onResolve = useResolveReviewItems( postType, postId );

	if ( ! items.length ) {
		return null;
	}

	// Group per block: clientId → groups of items targeting it.
	const groupsByClientId = new Map();
	for ( const group of groupByUnit( items ) ) {
		const clientId = clientIdByTarget[ group[ 0 ].targetId ];
		if ( ! clientId ) {
			continue;
		}
		if ( ! groupsByClientId.has( clientId ) ) {
			groupsByClientId.set( clientId, [] );
		}
		groupsByClientId.get( clientId ).push( group );
	}

	return Array.from( groupsByClientId.entries() ).map(
		( [ clientId, groups ] ) => (
			<ConflictMarker
				key={ clientId }
				clientId={ clientId }
				groups={ groups }
				onResolve={ onResolve }
				contentRef={ contentRef }
			/>
		)
	);
}
