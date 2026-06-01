/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	__experimentalUseBlockPreview as useBlockPreview,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { parse } from '@wordpress/blocks';
import { Button, Icon, Notice, TextareaControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { safeHTML } from '@wordpress/dom';
import { RawHTML, useMemo, useState } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { check, closeSmall, caution, seen } from '@wordpress/icons';
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import {
	DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES,
	DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES,
} from '../../store/distributed-editing';
import PluginPrePublishPanel from '../plugin-pre-publish-panel';

const FILTER_NAME = 'core/editor/distributed-editing-risky-block-review';
const RISKY_BLOCK_WASH = 'inset 0 0 0 9999px rgba(34, 113, 177, 0.08)';
const RISKY_BLOCK_MARKER = 'inset 4px 0 0 #2271b1';
const PENDING_GHOST_BLOCK_LIST_PREVIEW_STYLE = {
	background: 'rgba(34, 113, 177, 0.045)',
	border: '1px dashed rgba(34, 113, 177, 0.36)',
	borderInlineStart: '3px solid rgba(34, 113, 177, 0.55)',
	borderRadius: '2px',
	marginBlock: '4px 8px',
	opacity: 0.74,
	paddingBlock: '4px',
	paddingInline: '12px 8px',
	position: 'relative',
	transition:
		'background-color 120ms ease-out, border-color 120ms ease-out, opacity 120ms ease-out',
};
const PENDING_GHOST_BLOCK_LIST_PREVIEW_ACTIVE_STYLE = {
	background: 'rgba(34, 113, 177, 0.07)',
	borderColor: 'rgba(34, 113, 177, 0.56)',
	opacity: 1,
};
const PENDING_GHOST_PREVIEW_STYLE = {
	overflowWrap: 'anywhere',
	pointerEvents: 'none',
};
const PENDING_GHOST_CALLOUT_STYLE = {
	background: '#fff',
	border: '1px solid #c3c4c7',
	borderRadius: '2px',
	boxShadow: '0 8px 24px rgba(0, 0, 0, 0.14)',
	color: '#1e1e1e',
	display: 'grid',
	fontSize: '12px',
	gap: '4px',
	insetInlineStart: '8px',
	maxWidth: 'min(260px, calc(100vw - 32px))',
	minWidth: '180px',
	opacity: 0,
	overflowWrap: 'anywhere',
	padding: '8px',
	pointerEvents: 'none',
	position: 'absolute',
	top: 'calc(100% + 4px)',
	transform: 'translateY(-2px)',
	transition:
		'opacity 120ms ease-out, transform 120ms ease-out, visibility 120ms ease-out',
	visibility: 'hidden',
	zIndex: 20,
};
const PENDING_GHOST_CALLOUT_OPEN_STYLE = {
	opacity: 1,
	transform: 'translateY(0)',
	visibility: 'visible',
};
const PENDING_GHOST_CALLOUT_AUTHOR_STYLE = {
	fontSize: '13px',
	lineHeight: 1.4,
};
const PENDING_GHOST_CALLOUT_DETAIL_STYLE = {
	color: '#50575e',
	lineHeight: 1.4,
};
const EMPTY_PENDING_GHOSTS = {
	before: [],
	after: [],
};
const EMPTY_ARRAY = [];

/**
 * Returns whether the risky-block review panel has any state to render.
 *
 * @param {Object} reviewState Risky-block review selector state.
 *
 * @return {boolean} Whether the review surface should render.
 */
export function shouldRenderDistributedEditingRiskyBlockReview(
	reviewState = {}
) {
	return (
		reviewState.reviewItemCount > 0 &&
		reviewState.status !==
			DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.NONE &&
		reviewState.status !==
			DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.NO_REVIEW_REQUIRED &&
		reviewState.status !==
			DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.REJECTED_RAW_CONTENT
	);
}

/**
 * Returns wrapper props for the editor block annotation prototype.
 *
 * @param {Object} wrapperProps Existing BlockListBlock wrapper props.
 * @param {Object} reviewItem   Risky-block review item.
 *
 * @return {Object} Enhanced wrapper props.
 */
export function getDistributedEditingRiskyBlockReviewWrapperProps(
	wrapperProps = {},
	reviewItem = {}
) {
	const annotationLabel = getRiskyBlockReviewAnnotationLabel( reviewItem );
	const ariaLabel = wrapperProps[ 'aria-label' ]
		? sprintf(
				/* translators: 1: existing block label, 2: DE-RTC review label. */
				__( '%1$s. %2$s' ),
				wrapperProps[ 'aria-label' ],
				annotationLabel
		  )
		: annotationLabel;
	const style = {
		...wrapperProps.style,
		boxShadow: [
			wrapperProps.style?.boxShadow,
			RISKY_BLOCK_MARKER,
			RISKY_BLOCK_WASH,
		]
			.filter( Boolean )
			.join( ', ' ),
	};

	return {
		...wrapperProps,
		className: clsx(
			wrapperProps.className,
			'has-distributed-editing-risky-block-review'
		),
		'data-distributed-editing-risky-block-review':
			reviewItem.reviewStatus || 'pending_review',
		'data-distributed-editing-risky-block-review-item-id':
			reviewItem.id || '',
		'data-distributed-editing-risky-block-review-label': annotationLabel,
		'data-distributed-editing-risky-block-review-treatment':
			reviewItem.annotation?.visualTreatment ||
			'blue_warning_marker_with_focus_wash',
		'aria-label': ariaLabel,
		style,
	};
}

/**
 * Returns inert pending-edit ghosts that should be rendered next to a block.
 *
 * Ghosts represent another editor's unsaved local changes. The preview uses
 * only the sanitized static block-save HTML returned by WordPress presence; it
 * must never render unsanitized proposed block markup.
 *
 * @param {Array}  rosterEntries Presence roster entries.
 * @param {Array}  blockPath     Current block path.
 * @param {Object} options       Placement options.
 *
 * @return {Object} Ghosts grouped by placement.
 */
export function getDistributedEditingPendingGhostEntriesForBlockPath(
	rosterEntries = [],
	blockPath = [],
	options = {}
) {
	const normalizedBlockPath =
		getDistributedEditingNormalizedBlockPath( blockPath );

	if ( normalizedBlockPath.length === 0 ) {
		return EMPTY_PENDING_GHOSTS;
	}

	const ghosts = {
		before: [],
		after: [],
	};
	const seenGhosts = new Set();

	for ( const entry of Array.isArray( rosterEntries ) ? rosterEntries : [] ) {
		if (
			entry?.relationship === 'current_user_current_tab' ||
			! entry?.pendingPreview?.available ||
			! Array.isArray( entry.pendingPreview.items )
		) {
			continue;
		}

		const displayName = entry.displayName || __( 'Editor' );

		for ( const [ index, item ] of entry.pendingPreview.items.entries() ) {
			if (
				! isDistributedEditingPendingGhostRenderable( item, options )
			) {
				continue;
			}

			const placement =
				getDistributedEditingPendingGhostPlacementForBlockPath(
					item,
					normalizedBlockPath,
					options
				);

			if ( ! placement ) {
				continue;
			}

			const dedupeKey = getDistributedEditingPendingGhostDedupeKey(
				item,
				displayName,
				placement
			);

			if ( seenGhosts.has( dedupeKey ) ) {
				continue;
			}

			seenGhosts.add( dedupeKey );

			ghosts[ placement ].push( {
				...item,
				displayName,
				presenceUpdatedAtGmt:
					item.presenceUpdatedAtGmt ||
					item.presence_updated_at_gmt ||
					entry.pendingPreview.presenceUpdatedAtGmt ||
					entry.pendingPreview.presence_updated_at_gmt ||
					entry.presenceUpdatedAtGmt ||
					entry.presence_updated_at_gmt ||
					'',
				key: `${ entry.key || 'presence-editor' }-${
					item.previewId || index
				}-${ placement }`,
				placement,
			} );
		}
	}

	return ghosts;
}

function isDistributedEditingPendingGhostRenderable( item = {}, options = {} ) {
	if (
		Number.isFinite( options.minUpdatedAtMs ) &&
		! isDistributedEditingPendingGhostFreshEnough(
			item,
			options.minUpdatedAtMs
		)
	) {
		return false;
	}

	const anchorStatus =
		item.anchorStatus ||
		item.anchor_status ||
		item.locationStatus ||
		item.location_status ||
		'exact';

	return ! [
		'ambiguous',
		'unavailable',
		'unknown',
		'location_unavailable',
	].includes( String( anchorStatus ) );
}

function isDistributedEditingPendingGhostFreshEnough( item, minUpdatedAtMs ) {
	const updatedAt =
		item.presenceUpdatedAtGmt ||
		item.presence_updated_at_gmt ||
		item.updatedAtGmt ||
		item.updated_at_gmt ||
		item.reportedAtGmt ||
		item.reported_at_gmt ||
		'';
	const updatedAtMs = updatedAt
		? Date.parse(
				updatedAt.includes( 'T' )
					? updatedAt
					: `${ updatedAt.replace( ' ', 'T' ) }Z`
		  )
		: NaN;

	return Number.isFinite( updatedAtMs ) && updatedAtMs >= minUpdatedAtMs;
}

function getDistributedEditingPendingGhostPlacementForBlockPath(
	item = {},
	blockPath = [],
	options = {}
) {
	const itemPath = getDistributedEditingNormalizedBlockPath( item.blockPath );

	if ( itemPath.length === 0 || itemPath.length !== blockPath.length ) {
		return null;
	}

	const itemParentPath = itemPath.slice( 0, -1 );
	const blockParentPath = blockPath.slice( 0, -1 );

	if (
		! getDistributedEditingBlockPathsMatch(
			itemParentPath,
			blockParentPath
		)
	) {
		return null;
	}

	const itemIndex = itemPath[ itemPath.length - 1 ];
	const blockIndex = blockPath[ blockPath.length - 1 ];

	if ( item.changeKind === 'added_block' ) {
		if ( itemIndex === blockIndex ) {
			return 'before';
		}

		if ( itemIndex === blockIndex + 1 ) {
			const siblingCount = Number( options.siblingCount );

			if (
				Number.isInteger( siblingCount ) &&
				itemIndex < siblingCount
			) {
				return null;
			}

			return 'after';
		}

		return null;
	}

	return getDistributedEditingBlockPathsMatch( itemPath, blockPath )
		? 'after'
		: null;
}

/**
 * Adds a subtle warning marker and wash to blocks that have pending risky HTML
 * review items. This annotates editor chrome only; it does not mutate content,
 * save, dispatch notices, call transport, or change post locks.
 *
 * @param {Function} BlockListBlock Original BlockListBlock component.
 *
 * @return {Function} Enhanced BlockListBlock component.
 */
function withDistributedEditingRiskyBlockReviewAnnotations( BlockListBlock ) {
	return function WithDistributedEditingRiskyBlockReviewAnnotations( props ) {
		const [ mountedAtMs ] = useState( () => Date.now() );
		const { pendingGhostsJson, reviewItem } = useSelect(
			( select ) => {
				const editorSelect = select( editorStore );
				const {
					getDistributedEditingRiskyBlockReviewState,
					getDistributedEditingSessionState,
				} = editorSelect;
				const reviewState =
					getDistributedEditingRiskyBlockReviewState?.() || {};
				const blockEditorSelect = select( blockEditorStore );
				const blockContext =
					getDistributedEditingBlockPathContextForClientId(
						blockEditorSelect,
						props.clientId
					);
				const sessionState =
					getDistributedEditingSessionState?.() || {};
				const rosterEntries = Array.isArray(
					sessionState.presenceRosterEntries
				)
					? sessionState.presenceRosterEntries
					: EMPTY_ARRAY;
				const pendingGhosts =
					getDistributedEditingPendingGhostEntriesForBlockPath(
						rosterEntries,
						blockContext.blockPath,
						{
							minUpdatedAtMs: mountedAtMs,
							siblingCount: blockContext.siblingCount,
						}
					);
				let nextReviewItem = null;

				if (
					shouldRenderDistributedEditingRiskyBlockReview(
						reviewState
					) &&
					Array.isArray( reviewState.reviewItems )
				) {
					nextReviewItem =
						reviewState.reviewItems.find(
							( item ) =>
								item.blockClientId === props.clientId &&
								item.reviewStatus ===
									DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.PENDING_REVIEW
						) || null;
				}

				return {
					pendingGhostsJson: JSON.stringify( pendingGhosts ),
					reviewItem: nextReviewItem,
				};
			},
			[ mountedAtMs, props.clientId ]
		);
		const pendingGhosts = useMemo( () => {
			try {
				const parsed = JSON.parse( pendingGhostsJson );

				return {
					before: Array.isArray( parsed?.before )
						? parsed.before
						: EMPTY_ARRAY,
					after: Array.isArray( parsed?.after )
						? parsed.after
						: EMPTY_ARRAY,
				};
			} catch {
				return EMPTY_PENDING_GHOSTS;
			}
		}, [ pendingGhostsJson ] );
		const wrapperProps = reviewItem
			? getDistributedEditingRiskyBlockReviewWrapperProps(
					props.wrapperProps,
					reviewItem
			  )
			: props.wrapperProps;

		return (
			<>
				{ pendingGhosts.before.map( ( ghost ) => (
					<DistributedEditingPendingGhostBlockListPreview
						ghost={ ghost }
						key={ ghost.key }
					/>
				) ) }
				{ reviewItem ? (
					<BlockListBlock
						{ ...props }
						className={ clsx(
							props.className,
							'is-distributed-editing-risky-block-review-target'
						) }
						wrapperProps={ wrapperProps }
					/>
				) : (
					<BlockListBlock
						{ ...props }
						wrapperProps={ wrapperProps }
					/>
				) }
				{ pendingGhosts.after.map( ( ghost ) => (
					<DistributedEditingPendingGhostBlockListPreview
						ghost={ ghost }
						key={ ghost.key }
					/>
				) ) }
			</>
		);
	};
}

export function DistributedEditingPendingGhostBlockListPreview( { ghost } ) {
	const [ isCalloutOpen, setIsCalloutOpen ] = useState( false );
	const previewText = getDistributedEditingPendingGhostPreviewText( ghost );
	const previewBlocks = useMemo(
		() => getDistributedEditingPendingGhostPreviewBlocks( ghost ),
		[ ghost ]
	);
	const previewHtml = getDistributedEditingPendingGhostPreviewHtml( ghost );
	const shouldRenderRawHtmlPreview =
		previewHtml &&
		( ghost.blockName === 'core/html' || previewBlocks.length === 0 );
	const previewBlockProps = useBlockPreview( {
		blocks: previewBlocks,
		props: {
			className:
				'editor-distributed-editing-risky-block-review__pending-ghost-block-list',
		},
	} );
	const blockName = ghost.blockName || __( 'block' );
	const changeKind = ghost.changeKind || 'unknown_change';
	const tooltipId = `distributed-editing-pending-ghost-${
		ghost.key || 'preview'
	}`;
	const ghostLabel = sprintf(
		/* translators: 1: editor display name, 2: block name. */
		__( 'Pending edit by %1$s in %2$s' ),
		ghost.displayName,
		blockName
	);
	const changeLabel =
		getDistributedEditingPendingGhostChangeLabel( changeKind );
	let previewContent = (
		<div className="editor-distributed-editing-risky-block-review__pending-ghost-placeholder">
			{ previewText }
		</div>
	);

	if ( shouldRenderRawHtmlPreview ) {
		previewContent = (
			<div
				className="editor-distributed-editing-risky-block-review__pending-ghost-block-list"
				data-distributed-editing-pending-ghost-renderer="safe-html"
				data-testid="distributed-editing-pending-ghost-safe-html-preview"
			>
				<RawHTML>{ safeHTML( previewHtml ) }</RawHTML>
			</div>
		);
	} else if ( previewBlocks.length ) {
		previewContent = (
			<div
				{ ...previewBlockProps }
				data-distributed-editing-pending-ghost-renderer="block-preview"
			/>
		);
	}

	return (
		<div
			aria-label={ ghostLabel }
			aria-describedby={ tooltipId }
			className="editor-distributed-editing-risky-block-review__pending-ghost-block-list-preview"
			data-distributed-editing-pending-ghost="true"
			data-distributed-editing-pending-ghost-author={ ghost.displayName }
			data-distributed-editing-pending-ghost-author-inline="false"
			data-distributed-editing-pending-ghost-block-name={ blockName }
			data-distributed-editing-pending-ghost-change-kind={ changeKind }
			data-distributed-editing-pending-ghost-block-list-preview="true"
			data-distributed-editing-pending-ghost-callout="hover-focus"
			data-distributed-editing-pending-ghost-inert="true"
			data-distributed-editing-pending-ghost-placement="block-list"
			data-distributed-editing-pending-ghost-raw-content="false"
			data-distributed-editing-pending-ghost-visual-treatment="subtle-wash-border"
			onBlur={ ( event ) => {
				if ( ! event.currentTarget.contains( event.relatedTarget ) ) {
					setIsCalloutOpen( false );
				}
			} }
			onFocus={ () => setIsCalloutOpen( true ) }
			onMouseEnter={ () => setIsCalloutOpen( true ) }
			onMouseLeave={ () => setIsCalloutOpen( false ) }
			role="note"
			style={ {
				...PENDING_GHOST_BLOCK_LIST_PREVIEW_STYLE,
				...( isCalloutOpen
					? PENDING_GHOST_BLOCK_LIST_PREVIEW_ACTIVE_STYLE
					: {} ),
			} }
			tabIndex="0"
		>
			<div
				className="editor-distributed-editing-risky-block-review__pending-ghost-preview"
				inert=""
				style={ PENDING_GHOST_PREVIEW_STYLE }
			>
				{ previewContent }
			</div>
			<div
				aria-hidden={ ! isCalloutOpen }
				className="editor-distributed-editing-risky-block-review__pending-ghost-callout"
				data-distributed-editing-pending-ghost-author-callout="true"
				id={ tooltipId }
				role="tooltip"
				style={ {
					...PENDING_GHOST_CALLOUT_STYLE,
					...( isCalloutOpen
						? PENDING_GHOST_CALLOUT_OPEN_STYLE
						: {} ),
				} }
			>
				<strong
					className="editor-distributed-editing-risky-block-review__pending-ghost-callout-author"
					style={ PENDING_GHOST_CALLOUT_AUTHOR_STYLE }
				>
					{ ghost.displayName }
				</strong>
				<span
					className="editor-distributed-editing-risky-block-review__pending-ghost-callout-detail"
					style={ PENDING_GHOST_CALLOUT_DETAIL_STYLE }
				>
					{ blockName }
				</span>
				<span
					className="editor-distributed-editing-risky-block-review__pending-ghost-callout-detail"
					style={ PENDING_GHOST_CALLOUT_DETAIL_STYLE }
				>
					{ changeLabel }
				</span>
			</div>
		</div>
	);
}

function getDistributedEditingPendingGhostChangeLabel( changeKind ) {
	switch ( changeKind ) {
		case 'added_block':
			return __( 'Pending added block' );
		case 'modified_block':
			return __( 'Pending block edit' );
		case 'deleted_block':
			return __( 'Pending deleted block' );
		default:
			return __( 'Pending edit' );
	}
}

function getDistributedEditingPendingGhostDedupeKey(
	item = {},
	displayName = '',
	placement = ''
) {
	return [
		placement,
		displayName,
		item.previewId || item.preview_id || '',
		getDistributedEditingNormalizedBlockPath( item.blockPath ).join( '.' ),
		item.blockName || item.block_name || '',
		item.changeKind || item.change_kind || '',
		item.safePreviewSerializedBlocks ||
			item.safe_preview_serialized_blocks ||
			'',
		item.safePreviewHtml || item.safe_preview_html || '',
		item.safePreviewText || item.safe_preview_text || '',
	].join( '\u0000' );
}

function getDistributedEditingNormalizedBlockPath( blockPath ) {
	if ( typeof blockPath === 'string' ) {
		return blockPath
			.split( '.' )
			.map( ( value ) => Number( value ) )
			.filter( ( value ) => Number.isInteger( value ) && value >= 0 );
	}

	if ( ! Array.isArray( blockPath ) ) {
		return [];
	}

	return blockPath
		.map( ( value ) => Number( value ) )
		.filter( ( value ) => Number.isInteger( value ) && value >= 0 );
}

function getDistributedEditingBlockPathsMatch( firstPath, secondPath ) {
	return (
		firstPath.length === secondPath.length &&
		firstPath.every( ( value, index ) => value === secondPath[ index ] )
	);
}

addFilter(
	'editor.BlockListBlock',
	FILTER_NAME,
	withDistributedEditingRiskyBlockReviewAnnotations
);

function getDistributedEditingBlockPathContextForClientId(
	blockEditorSelect,
	clientId
) {
	if (
		! clientId ||
		typeof blockEditorSelect?.getBlockParents !== 'function' ||
		typeof blockEditorSelect?.getBlockIndex !== 'function'
	) {
		return {
			blockPath: [],
			siblingCount: null,
		};
	}

	const parentClientIds = blockEditorSelect.getBlockParents( clientId ) || [];
	const pathClientIds = [ ...parentClientIds, clientId ];
	const blockPath = pathClientIds.map( ( pathClientId ) =>
		blockEditorSelect.getBlockIndex( pathClientId )
	);
	const rootClientId =
		typeof blockEditorSelect.getBlockRootClientId === 'function'
			? blockEditorSelect.getBlockRootClientId( clientId )
			: null;
	const siblingClientIds =
		typeof blockEditorSelect.getBlockOrder === 'function'
			? blockEditorSelect.getBlockOrder( rootClientId )
			: null;

	return {
		blockPath: getDistributedEditingNormalizedBlockPath( blockPath ),
		siblingCount: Array.isArray( siblingClientIds )
			? siblingClientIds.length
			: null,
	};
}

function getDistributedEditingPendingGhostPreviewText( ghost = {} ) {
	if ( ghost.rawContentIncluded || ghost.exposesRawContent ) {
		return __( 'Pending edit' );
	}

	const previewText =
		ghost.safePreviewText ||
		ghost.safePreviewHtml ||
		( ghost.changeKind === 'deleted_block'
			? __( 'Deleted block' )
			: __( 'Pending edit' ) );

	return String( previewText ).replace( /\s+/g, ' ' ).trim();
}

function getDistributedEditingPendingGhostPreviewSerializedBlocks(
	ghost = {}
) {
	if ( ghost.rawContentIncluded || ghost.exposesRawContent ) {
		return '';
	}

	const serialized =
		ghost.safePreviewSerializedBlocks ||
		ghost.safe_preview_serialized_blocks ||
		'';

	return typeof serialized === 'string' && /<!--\s*\/?wp:/.test( serialized )
		? serialized
		: '';
}

function getDistributedEditingPendingGhostPreviewHtml( ghost = {} ) {
	if ( ghost.rawContentIncluded || ghost.exposesRawContent ) {
		return '';
	}

	const html = ghost.safePreviewHtml || ghost.safe_preview_html || '';

	return typeof html === 'string' ? html : '';
}

function getDistributedEditingPendingGhostPreviewBlocks( ghost = {} ) {
	const serialized =
		getDistributedEditingPendingGhostPreviewSerializedBlocks( ghost );

	if ( ! serialized ) {
		return EMPTY_ARRAY;
	}

	try {
		const blocks = parse( serialized );
		return Array.isArray( blocks ) ? blocks : EMPTY_ARRAY;
	} catch {
		return EMPTY_ARRAY;
	}
}

/**
 * Renders the production chrome prompt that opens the pre-publish review panel.
 *
 * @param {Object}   props              Component props.
 * @param {Function} props.onOpenReview Optional open observer.
 *
 * @return {React.ReactNode} Rendered chrome prompt.
 */
export function DistributedEditingRiskyBlockReviewStatusChrome( {
	onOpenReview,
} ) {
	const { reviewState } = useDistributedEditingRiskyBlockReviewState();
	const { __experimentalOpenDistributedEditingRiskyBlockReview } =
		useDispatch( editorStore ) || {};

	if (
		! shouldRenderDistributedEditingRiskyBlockReview( reviewState ) ||
		! reviewState.prePublishPanelRequired
	) {
		return null;
	}

	async function openReview() {
		const result =
			await __experimentalOpenDistributedEditingRiskyBlockReview?.();
		onOpenReview?.( result );
		return result;
	}

	return (
		<div
			aria-label={ __( 'Distributed Editing HTML review' ) }
			className="editor-distributed-editing-risky-block-review__chrome"
			data-distributed-editing-risky-block-review-chrome
			role="region"
		>
			<Notice
				actions={ [
					{
						label: __( 'Review HTML' ),
						onClick: openReview,
					},
				] }
				isDismissible={ false }
				status="warning"
			>
				<strong>{ __( 'HTML review required' ) }</strong>
				<div>{ getRiskyBlockReviewSummaryMessage( reviewState ) }</div>
			</Notice>
		</div>
	);
}

/**
 * Renders a content-free marker for risky review items inside the editor List View.
 *
 * @param {Object} props       Component props.
 * @param {Object} props.block List View block object.
 *
 * @return {React.ReactNode} Rendered List View marker.
 */
export function DistributedEditingRiskyBlockReviewListViewMarker( { block } ) {
	const reviewItem = usePendingRiskyBlockReviewItemForClientId(
		block?.clientId
	);

	if ( ! reviewItem ) {
		return null;
	}

	const label = getRiskyBlockReviewAnnotationLabel( reviewItem, 0 );

	return (
		<span
			aria-label={ label }
			className="editor-distributed-editing-risky-block-review__list-view-marker"
			data-distributed-editing-risky-block-review-item-id={
				reviewItem.id || ''
			}
			data-distributed-editing-risky-block-review-list-view-marker
			data-distributed-editing-risky-block-review-treatment={
				reviewItem.annotation?.visualTreatment || 'icon_warning_marker'
			}
			role="img"
		>
			<Icon icon={ caution } size={ 18 } />
		</span>
	);
}

/**
 * Renders a pre-publish slot panel for DE-RTC risky-block review.
 *
 * @param {Object}   props             Component props.
 * @param {Function} props.onFocusItem Optional focus observer.
 * @param {Function} props.onResolve   Optional resolution observer.
 *
 * @return {React.ReactNode} Rendered pre-publish Fill.
 */
export default function DistributedEditingRiskyBlockReviewPrePublishPanel( {
	onFocusItem,
	onResolve,
} ) {
	const { reviewState, savePolicy } =
		useDistributedEditingRiskyBlockReviewState();
	const {
		__experimentalFocusDistributedEditingRiskyBlockReviewItem,
		__experimentalLoadDistributedEditingRiskyBlockReviewItemDetail,
		__experimentalResolveDistributedEditingRiskyBlockReviewItem,
	} = useDispatch( editorStore ) || {};

	if ( ! shouldRenderDistributedEditingRiskyBlockReview( reviewState ) ) {
		return null;
	}

	async function focusReviewItem( reviewItem ) {
		const result =
			await __experimentalFocusDistributedEditingRiskyBlockReviewItem?.(
				reviewItem.id
			);
		onFocusItem?.( reviewItem, result );
		return result;
	}

	async function loadReviewItemDetail( reviewItem ) {
		return __experimentalLoadDistributedEditingRiskyBlockReviewItemDetail?.(
			reviewItem.id
		);
	}

	async function resolveReviewItem( reviewItem, decision, options = {} ) {
		const result =
			await __experimentalResolveDistributedEditingRiskyBlockReviewItem?.(
				{
					reviewItemId: reviewItem.id,
					decision,
					...options,
				}
			);
		onResolve?.( reviewItem, decision, result );
		return result;
	}

	return (
		<PluginPrePublishPanel
			className="editor-distributed-editing-risky-block-review__pre-publish-panel"
			icon={ caution }
			initialOpen
			title={ __( 'HTML review' ) }
		>
			<DistributedEditingRiskyBlockReviewPanel
				onFocusItem={ focusReviewItem }
				onLoadDetail={ loadReviewItemDetail }
				onResolve={ resolveReviewItem }
				reviewState={ reviewState }
				savePolicy={ savePolicy }
			/>
		</PluginPrePublishPanel>
	);
}

/**
 * Renders the hash-only review list.
 *
 * @param {Object}   props              Component props.
 * @param {Function} props.onFocusItem  Optional focus handler.
 * @param {Function} props.onLoadDetail Optional detail loader.
 * @param {Function} props.onResolve    Optional resolution handler.
 * @param {Object}   props.reviewState  Risky-block review state.
 * @param {Object}   props.savePolicy   Save policy state.
 *
 * @return {React.ReactNode} Rendered review panel.
 */
export function DistributedEditingRiskyBlockReviewPanel( {
	onFocusItem,
	onLoadDetail,
	onResolve,
	reviewState = {},
	savePolicy = {},
} ) {
	const reviewItems = getVisibleRiskyBlockReviewItems(
		Array.isArray( reviewState.reviewItems ) ? reviewState.reviewItems : []
	);
	const saveVocabulary =
		getDistributedEditingRiskyBlockReviewSaveVocabulary( savePolicy );
	const shouldRenderSaveVocabulary = Boolean(
		saveVocabulary.localChangesText ||
			saveVocabulary.reviewCheckpointText ||
			saveVocabulary.authoritativePostText
	);

	return (
		<div
			aria-label={ __( 'HTML review state' ) }
			className="editor-distributed-editing-risky-block-review"
			data-distributed-editing-risky-block-review-panel
			data-distributed-editing-save-authoritative-post-state={
				saveVocabulary.authoritativePostState || undefined
			}
			data-distributed-editing-save-click-action={
				savePolicy.clickAction || ''
			}
			data-distributed-editing-save-local-changes-state={
				saveVocabulary.localChangesState || undefined
			}
			data-distributed-editing-save-review-checkpoint-state={
				saveVocabulary.reviewCheckpointState || undefined
			}
			data-distributed-editing-save-state-summary={
				saveVocabulary.summaryText || undefined
			}
			role="region"
		>
			<p className="editor-distributed-editing-risky-block-review__summary">
				{ getRiskyBlockReviewSummaryMessage( reviewState ) }
			</p>
			{ shouldRenderSaveVocabulary && (
				<dl
					aria-label={ __( 'WordPress Save state' ) }
					className="editor-distributed-editing-risky-block-review__save-vocabulary"
					data-distributed-editing-risky-block-review-save-vocabulary
				>
					{ saveVocabulary.localChangesText && (
						<div>
							<dt>{ __( 'Local changes' ) }</dt>
							<dd>{ saveVocabulary.localChangesText }</dd>
						</div>
					) }
					{ saveVocabulary.reviewCheckpointText && (
						<div>
							<dt>{ __( 'Review' ) }</dt>
							<dd>{ saveVocabulary.reviewCheckpointText }</dd>
						</div>
					) }
					{ saveVocabulary.authoritativePostText && (
						<div>
							<dt>{ __( 'WordPress post' ) }</dt>
							<dd>{ saveVocabulary.authoritativePostText }</dd>
						</div>
					) }
				</dl>
			) }
			<dl className="editor-distributed-editing-risky-block-review__counts">
				<div>
					<dt>{ __( 'Pending' ) }</dt>
					<dd>{ reviewState.pendingReviewItemCount || 0 }</dd>
				</div>
				<div>
					<dt>{ __( 'Approved' ) }</dt>
					<dd>{ reviewState.approvedReviewItemCount || 0 }</dd>
				</div>
				<div>
					<dt>{ __( 'Rejected' ) }</dt>
					<dd>{ reviewState.rejectedReviewItemCount || 0 }</dd>
				</div>
			</dl>
			<ul className="editor-distributed-editing-risky-block-review__items">
				{ reviewItems.map( ( reviewItem, index ) => (
					<DistributedEditingRiskyBlockReviewItem
						index={ index }
						key={ reviewItem.id }
						onFocusItem={ onFocusItem }
						onLoadDetail={ onLoadDetail }
						onResolve={ onResolve }
						reviewItem={ reviewItem }
					/>
				) ) }
			</ul>
		</div>
	);
}

function getVisibleRiskyBlockReviewItems( reviewItems ) {
	const localItemsByKey = new Map();
	const serverBackedKeys = new Set();

	for ( const reviewItem of reviewItems ) {
		const key = getRiskyBlockReviewItemDuplicateKey( reviewItem );

		if ( ! key ) {
			continue;
		}

		if ( isServerBackedRiskyBlockReviewItem( reviewItem ) ) {
			serverBackedKeys.add( key );
		} else if ( isLocalKsesRiskyBlockReviewItem( reviewItem ) ) {
			localItemsByKey.set( key, reviewItem );
		}
	}

	return reviewItems
		.filter( ( reviewItem ) => {
			const key = getRiskyBlockReviewItemDuplicateKey( reviewItem );

			return (
				! isLocalKsesRiskyBlockReviewItem( reviewItem ) ||
				! serverBackedKeys.has( key )
			);
		} )
		.map( ( reviewItem ) => {
			if ( ! isServerBackedRiskyBlockReviewItem( reviewItem ) ) {
				return reviewItem;
			}

			const localItem = localItemsByKey.get(
				getRiskyBlockReviewItemDuplicateKey( reviewItem )
			);

			if ( ! localItem ) {
				return reviewItem;
			}

			return {
				...reviewItem,
				annotation: reviewItem.annotation || localItem.annotation,
				blockClientId:
					reviewItem.blockClientId || localItem.blockClientId,
				blockLabel: reviewItem.blockLabel || localItem.blockLabel,
				blockName: reviewItem.blockName || localItem.blockName,
			};
		} );
}

function getRiskyBlockReviewItemDuplicateKey( reviewItem = {} ) {
	const blockPath = Array.isArray( reviewItem.blockPath )
		? reviewItem.blockPath.join( '.' )
		: reviewItem.blockPath || '';
	const fields = [
		reviewItem.changeKind,
		reviewItem.riskReason,
		reviewItem.proposedContentHash,
		reviewItem.ksesFilteredContentHash,
		blockPath,
	];

	if ( fields.some( ( field ) => ! field ) ) {
		return '';
	}

	return fields.join( '|' );
}

function isServerBackedRiskyBlockReviewItem( reviewItem = {} ) {
	return String( reviewItem.id || '' ).startsWith( 'de-rtc-review-' );
}

function isLocalKsesRiskyBlockReviewItem( reviewItem = {} ) {
	return String( reviewItem.id || '' ).startsWith( 'kses-review-' );
}

function getDistributedEditingRiskyBlockReviewSaveVocabulary(
	savePolicy = {}
) {
	const stateVocabulary =
		savePolicy.saveButtonStateVocabulary ||
		savePolicy.saveButton?.stateVocabulary ||
		savePolicy.stateVocabulary ||
		{};

	return {
		localChangesState:
			savePolicy.saveButtonLocalChangesState ||
			stateVocabulary.localChangesState ||
			'',
		reviewCheckpointState:
			savePolicy.saveButtonReviewCheckpointState ||
			stateVocabulary.reviewCheckpointState ||
			'',
		authoritativePostState:
			savePolicy.saveButtonAuthoritativePostState ||
			stateVocabulary.authoritativePostState ||
			savePolicy.saveButtonAuthorityState ||
			savePolicy.authorityState ||
			'',
		summaryText:
			savePolicy.saveButtonStateSummaryText ||
			stateVocabulary.summaryText ||
			'',
		localChangesText: stateVocabulary.localChangesText || '',
		reviewCheckpointText: stateVocabulary.reviewCheckpointText || '',
		authoritativePostText:
			stateVocabulary.authoritativePostText ||
			savePolicy.saveButtonAuthorityStatusText ||
			savePolicy.authorityStatusText ||
			'',
	};
}

function DistributedEditingRiskyBlockReviewItem( {
	index,
	onFocusItem,
	onLoadDetail,
	onResolve,
	reviewItem,
} ) {
	const [ detailItem, setDetailItem ] = useState( null );
	const [ isDetailLoading, setIsDetailLoading ] = useState( false );
	const [ isModifying, setIsModifying ] = useState( false );
	const [ reviewedBlockSource, setReviewedBlockSource ] = useState( '' );
	const activeReviewItem = detailItem || reviewItem;
	const isPending =
		reviewItem.reviewStatus ===
		DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.PENDING_REVIEW;
	const label = getRiskyBlockReviewItemLabel( reviewItem, index );
	const hasReviewSource = Boolean( activeReviewItem.proposedSourceDisplay );
	const canApprove = reviewItem.canApprove === true;
	const canModifyAdopt = reviewItem.canModifyAdopt === true;
	const canReject = reviewItem.canReject === true;
	const canDiscard = reviewItem.canDiscard === true;
	const canReview = canApprove || canModifyAdopt || canReject;
	const shouldLoadDetailBeforeReviewAction =
		canReview && isServerBackedRiskyBlockReviewItem( reviewItem );
	const reviewActionReady =
		! shouldLoadDetailBeforeReviewAction || hasReviewSource;
	const rejectDecision = canDiscard && ! canReject ? 'discarded' : 'rejected';
	const rejectLabel =
		canDiscard && ! canReject ? __( 'Discard' ) : __( 'Reject' );
	const rejectButtonLabel =
		canDiscard && ! canReject
			? sprintf(
					/* translators: %s: block label. */
					__( 'Discard HTML change for %s' ),
					label
			  )
			: sprintf(
					/* translators: %s: block label. */
					__( 'Reject HTML change for %s' ),
					label
			  );

	async function loadDetail() {
		if ( hasReviewSource || ! onLoadDetail ) {
			return activeReviewItem;
		}

		setIsDetailLoading( true );
		try {
			const detailResult = await onLoadDetail( reviewItem );
			const nextDetailItem = detailResult?.item || reviewItem;
			setDetailItem( nextDetailItem );
			return nextDetailItem;
		} finally {
			setIsDetailLoading( false );
		}
	}

	async function startModify() {
		const detailResult =
			! hasReviewSource && onLoadDetail ? await loadDetail() : null;
		const itemToModify = detailResult || activeReviewItem;

		setReviewedBlockSource(
			getEditableReviewItemSource( itemToModify ) ||
				reviewedBlockSource ||
				''
		);
		setIsModifying( true );
	}

	return (
		<li
			className={ clsx(
				'editor-distributed-editing-risky-block-review__item',
				`is-${ reviewItem.reviewStatus || 'pending_review' }`
			) }
			data-distributed-editing-risky-block-client-id={
				reviewItem.blockClientId || ''
			}
			data-distributed-editing-risky-block-id={ reviewItem.id }
			data-distributed-editing-risky-block-review-status={
				reviewItem.reviewStatus
			}
			data-distributed-editing-supports-compare="hash-only"
			data-distributed-editing-supports-jump={
				reviewItem.blockClientId ? 'true' : 'false'
			}
		>
			<div className="editor-distributed-editing-risky-block-review__item-header">
				{ canReview && ! reviewActionReady && (
					<Button
						__next40pxDefaultSize
						accessibleWhenDisabled
						disabled={ ! isPending || isDetailLoading }
						icon={ seen }
						label={ sprintf(
							/* translators: %s: block label. */
							__( 'Review HTML change for %s' ),
							label
						) }
						onClick={ loadDetail }
						size="compact"
						variant="secondary"
					>
						{ isDetailLoading ? __( 'Loading' ) : __( 'Review' ) }
					</Button>
				) }
				{ canApprove && reviewActionReady && (
					<Button
						__next40pxDefaultSize
						accessibleWhenDisabled
						disabled={ ! isPending }
						icon={ check }
						label={ sprintf(
							/* translators: %s: block label. */
							__( 'Approve HTML change for %s' ),
							label
						) }
						onClick={ () => onResolve?.( reviewItem, 'approved' ) }
						size="compact"
						variant="tertiary"
					/>
				) }
				{ canModifyAdopt && reviewActionReady && (
					<Button
						__next40pxDefaultSize
						accessibleWhenDisabled
						disabled={ ! isPending }
						label={ sprintf(
							/* translators: %s: block label. */
							__( 'Modify HTML change for %s' ),
							label
						) }
						onClick={ startModify }
						size="compact"
						variant="tertiary"
					>
						{ __( 'Modify' ) }
					</Button>
				) }
				<div className="editor-distributed-editing-risky-block-review__item-title">
					<span
						aria-hidden="true"
						className="editor-distributed-editing-risky-block-review__marker"
					/>
					<span>{ label }</span>
				</div>
				{ ( canDiscard || ( canReject && reviewActionReady ) ) && (
					<Button
						__next40pxDefaultSize
						accessibleWhenDisabled
						disabled={ ! isPending }
						icon={ closeSmall }
						isDestructive
						label={ rejectButtonLabel }
						onClick={ () =>
							onResolve?.( reviewItem, rejectDecision )
						}
						size="compact"
						variant="tertiary"
					>
						{ rejectLabel }
					</Button>
				) }
			</div>
			<p className="editor-distributed-editing-risky-block-review__item-guidance">
				{ getRiskyBlockReviewItemAffordanceMessage(
					reviewItem,
					index
				) }
			</p>
			<div className="editor-distributed-editing-risky-block-review__item-meta">
				<span>{ getChangeKindLabel( reviewItem.changeKind ) }</span>
				<span>{ getRiskReasonLabel( reviewItem.riskReason ) }</span>
				<span>
					{ getReviewItemStatusLabel( reviewItem.reviewStatus ) }
				</span>
			</div>
			<div className="editor-distributed-editing-risky-block-review__item-evidence">
				<code>
					{ getHashSummaryLabel(
						__( 'Proposed' ),
						reviewItem.proposedContentHash
					) }
				</code>
				<code>
					{ getHashSummaryLabel(
						__( 'KSES' ),
						reviewItem.ksesFilteredContentHash
					) }
				</code>
			</div>
			{ hasReviewSource && (
				<div
					className="editor-distributed-editing-risky-block-review__item-detail"
					data-distributed-editing-risky-block-review-detail
				>
					<div>
						<strong>{ __( 'Proposed HTML' ) }</strong>
						<pre>
							<code>
								{ getEditableReviewItemSource(
									activeReviewItem
								) }
							</code>
						</pre>
					</div>
					<div>
						<strong>{ __( 'WordPress would keep' ) }</strong>
						<pre>
							<code>
								{ getEscapedReviewItemSource(
									activeReviewItem,
									'ksesFilteredSourceDisplay'
								) }
							</code>
						</pre>
					</div>
				</div>
			) }
			{ isModifying && (
				<div className="editor-distributed-editing-risky-block-review__item-modify">
					<TextareaControl
						__nextHasNoMarginBottom
						label={ sprintf(
							/* translators: %s: block label. */
							__( 'Edited HTML for %s' ),
							label
						) }
						onChange={ setReviewedBlockSource }
						value={ reviewedBlockSource }
					/>
					<div className="editor-distributed-editing-risky-block-review__item-modify-actions">
						<Button
							__next40pxDefaultSize
							accessibleWhenDisabled
							disabled={
								! isPending ||
								! canModifyAdopt ||
								reviewedBlockSource.trim() === ''
							}
							onClick={ () =>
								onResolve?.( reviewItem, 'modify-adopt', {
									reviewedBlockSource,
								} )
							}
							size="compact"
							variant="primary"
						>
							{ __( 'Adopt edited HTML' ) }
						</Button>
						<Button
							__next40pxDefaultSize
							onClick={ () => setIsModifying( false ) }
							size="compact"
							variant="tertiary"
						>
							{ __( 'Cancel' ) }
						</Button>
					</div>
				</div>
			) }
			<Button
				__next40pxDefaultSize
				accessibleWhenDisabled
				disabled={ ! reviewItem.blockClientId }
				icon={ seen }
				label={ sprintf(
					/* translators: %s: block label. */
					__( 'Jump to %s' ),
					label
				) }
				onClick={ () => onFocusItem?.( reviewItem ) }
				size="compact"
				variant="secondary"
			>
				{ __( 'Jump to block' ) }
			</Button>
		</li>
	);
}

function useDistributedEditingRiskyBlockReviewState() {
	return useSelect( ( select ) => {
		const {
			getDistributedEditingRiskyBlockReviewState,
			getDistributedEditingSavePolicyState,
		} = select( editorStore );

		return {
			reviewState: getDistributedEditingRiskyBlockReviewState?.() || {},
			savePolicy: getDistributedEditingSavePolicyState?.() || {},
		};
	}, [] );
}

function usePendingRiskyBlockReviewItemForClientId( clientId ) {
	return useSelect(
		( select ) => {
			if ( ! clientId ) {
				return null;
			}

			const { getDistributedEditingRiskyBlockReviewState } =
				select( editorStore );
			const reviewState =
				getDistributedEditingRiskyBlockReviewState?.() || {};

			if (
				! shouldRenderDistributedEditingRiskyBlockReview(
					reviewState
				) ||
				! Array.isArray( reviewState.reviewItems )
			) {
				return null;
			}

			return (
				reviewState.reviewItems.find(
					( item ) =>
						item.blockClientId === clientId &&
						item.reviewStatus ===
							DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.PENDING_REVIEW
				) || null
			);
		},
		[ clientId ]
	);
}

function getRiskyBlockReviewSummaryMessage( reviewState = {} ) {
	const pendingCount = reviewState.pendingReviewItemCount || 0;

	if (
		reviewState.requiresServerStateRefetch ||
		reviewState.status ===
			DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.STALE_AFTER_REVIEW
	) {
		return __(
			'The server changed after HTML review. Refresh the server version before saving.'
		);
	}

	if ( pendingCount > 0 ) {
		return sprintf(
			/* translators: %d: number of blocks requiring HTML review. */
			_n(
				'%d highlighted block needs HTML review.',
				'%d highlighted blocks need HTML review.',
				pendingCount
			),
			pendingCount
		);
	}

	return __( 'HTML review is resolved for this update.' );
}

function getRiskyBlockReviewAnnotationLabel( reviewItem, index = 0 ) {
	if ( reviewItem.annotation?.saveAuthorityLabel ) {
		return reviewItem.annotation.saveAuthorityLabel;
	}

	return sprintf(
		/* translators: %s: block label. */
		__( 'HTML review required for %s' ),
		getRiskyBlockReviewItemLabel( reviewItem, index )
	);
}

function getEditableReviewItemSource( reviewItem = {} ) {
	return getEscapedReviewItemSource( reviewItem, 'proposedSourceDisplay' );
}

function getEscapedReviewItemSource( reviewItem = {}, fieldName ) {
	const displaySource = reviewItem[ fieldName ];

	if ( typeof displaySource !== 'string' || displaySource === '' ) {
		return '';
	}

	if ( typeof document === 'undefined' ) {
		return displaySource;
	}

	const textarea = document.createElement( 'textarea' );
	textarea.innerHTML = displaySource;
	return textarea.value;
}

function getRiskyBlockReviewItemAffordanceMessage( reviewItem, index ) {
	if ( reviewItem.annotation?.saveAuthorityMessage ) {
		return reviewItem.annotation.saveAuthorityMessage;
	}

	const label = getRiskyBlockReviewItemLabel( reviewItem, index );

	switch ( reviewItem.reviewStatus ) {
		case DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.APPROVED_FOR_RETRY_SAVE:
			return sprintf(
				/* translators: %s: block label. */
				__( '%s was approved for WordPress Save.' ),
				label
			);
		case DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.REJECTED:
			return sprintf(
				/* translators: %s: block label. */
				__(
					'%s was rejected and will not be included when WordPress updates the post.'
				),
				label
			);
		case DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.STALE_AFTER_REVIEW:
			return sprintf(
				/* translators: %s: block label. */
				__( '%s needs a server refresh before review can continue.' ),
				label
			);
	}

	return __(
		'This highlighted block needs HTML review before it can be included.'
	);
}

function getRiskyBlockReviewItemLabel( reviewItem, index ) {
	return (
		reviewItem.blockLabel ||
		reviewItem.blockName ||
		sprintf(
			/* translators: %d: review item number. */
			__( 'Review item %d' ),
			index + 1
		)
	);
}

function getChangeKindLabel( changeKind ) {
	switch ( changeKind ) {
		case 'added_block':
			return __( 'Added block' );
		case 'deleted_block':
			return __( 'Deleted block' );
		case 'modified_block':
			return __( 'Modified block' );
	}

	return __( 'Changed block' );
}

function getRiskReasonLabel( riskReason ) {
	switch ( riskReason ) {
		case 'kses_would_remove_script':
			return __( 'Script would be removed' );
		case 'kses_would_alter_attributes':
			return __( 'Attributes would change' );
		case 'kses_would_rewrite_html':
			return __( 'HTML would change' );
		case 'unfiltered_html_block_deleted':
			return __( 'Unfiltered HTML would be deleted' );
	}

	return __( 'HTML requires review' );
}

function getReviewItemStatusLabel( reviewStatus ) {
	switch ( reviewStatus ) {
		case DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.APPROVED_FOR_RETRY_SAVE:
			return __( 'Approved' );
		case DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.REJECTED:
			return __( 'Rejected' );
		case DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.STALE_AFTER_REVIEW:
			return __( 'Stale' );
	}

	return __( 'Pending review' );
}

function getHashSummaryLabel( label, hash ) {
	if ( ! hash ) {
		return sprintf(
			/* translators: %s: hash label. */
			__( '%s hash unavailable' ),
			label
		);
	}

	return sprintf(
		/* translators: 1: hash label, 2: shortened hash. */
		__( '%1$s %2$s' ),
		label,
		hash.slice( 0, 18 )
	);
}
