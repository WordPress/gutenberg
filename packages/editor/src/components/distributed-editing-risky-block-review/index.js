/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { Button, Icon, Notice } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
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
	DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS,
} from '../../store/distributed-editing';
import PluginPrePublishPanel from '../plugin-pre-publish-panel';

const FILTER_NAME = 'core/editor/distributed-editing-risky-block-review';
const RISKY_BLOCK_WASH = 'inset 0 0 0 9999px rgba(34, 113, 177, 0.08)';
const RISKY_BLOCK_MARKER = 'inset 4px 0 0 #2271b1';

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
		const reviewItem = useSelect(
			( select ) => {
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

				return reviewState.reviewItems.find(
					( item ) =>
						item.blockClientId === props.clientId &&
						item.reviewStatus ===
							DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.PENDING_REVIEW
				);
			},
			[ props.clientId ]
		);

		if ( ! reviewItem ) {
			return <BlockListBlock { ...props } />;
		}

		return (
			<BlockListBlock
				{ ...props }
				className={ clsx(
					props.className,
					'is-distributed-editing-risky-block-review-target'
				) }
				wrapperProps={ getDistributedEditingRiskyBlockReviewWrapperProps(
					props.wrapperProps,
					reviewItem
				) }
			/>
		);
	};
}

addFilter(
	'editor.BlockListBlock',
	FILTER_NAME,
	withDistributedEditingRiskyBlockReviewAnnotations
);

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
	const { reviewState, savePolicy } =
		useDistributedEditingRiskyBlockReviewState();
	const { __experimentalOpenDistributedEditingRiskyBlockReview } =
		useDispatch( editorStore ) || {};

	if (
		! shouldRenderDistributedEditingRiskyBlockReview( reviewState ) ||
		savePolicy.clickAction !==
			DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.OPEN_PRE_PUBLISH_REVIEW
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
						label: __( 'Review changes' ),
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

	async function resolveReviewItem( reviewItem, decision ) {
		const result =
			await __experimentalResolveDistributedEditingRiskyBlockReviewItem?.(
				{
					reviewItemId: reviewItem.id,
					decision,
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
 * @param {Object}   props             Component props.
 * @param {Function} props.onFocusItem Optional focus handler.
 * @param {Function} props.onResolve   Optional resolution handler.
 * @param {Object}   props.reviewState Risky-block review state.
 * @param {Object}   props.savePolicy  Save policy state.
 *
 * @return {React.ReactNode} Rendered review panel.
 */
export function DistributedEditingRiskyBlockReviewPanel( {
	onFocusItem,
	onResolve,
	reviewState = {},
	savePolicy = {},
} ) {
	const reviewItems = Array.isArray( reviewState.reviewItems )
		? reviewState.reviewItems
		: [];
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
						onResolve={ onResolve }
						reviewItem={ reviewItem }
					/>
				) ) }
			</ul>
		</div>
	);
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
	onResolve,
	reviewItem,
} ) {
	const isPending =
		reviewItem.reviewStatus ===
		DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.PENDING_REVIEW;
	const label = getRiskyBlockReviewItemLabel( reviewItem, index );

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
				<div className="editor-distributed-editing-risky-block-review__item-title">
					<span
						aria-hidden="true"
						className="editor-distributed-editing-risky-block-review__marker"
					/>
					<span>{ label }</span>
				</div>
				<Button
					__next40pxDefaultSize
					accessibleWhenDisabled
					disabled={ ! isPending }
					icon={ closeSmall }
					isDestructive
					label={ sprintf(
						/* translators: %s: block label. */
						__( 'Reject HTML change for %s' ),
						label
					) }
					onClick={ () => onResolve?.( reviewItem, 'rejected' ) }
					size="compact"
					variant="tertiary"
				/>
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
				'%d highlighted block needs HTML review before Save can update the post.',
				'%d highlighted blocks need HTML review before Save can update the post.',
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
		__( 'HTML review required before Save for %s' ),
		getRiskyBlockReviewItemLabel( reviewItem, index )
	);
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
		'This highlighted block needs HTML review before Save can update the post.'
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
