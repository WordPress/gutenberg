/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { SlotFillProvider } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import DistributedEditingRiskyBlockReviewPrePublishPanel, {
	DistributedEditingPendingGhostBlockListPreview,
	DistributedEditingRiskyBlockReviewListViewMarker,
	DistributedEditingRiskyBlockReviewPanel,
	DistributedEditingRiskyBlockReviewStatusChrome,
	getDistributedEditingAuthorshipFocusForBlockPath,
	getDistributedEditingAuthorshipFocusWrapperProps,
	getDistributedEditingAuthorshipRichTextRanges,
	getDistributedEditingPendingGhostEntriesForBlockPath,
	getDistributedEditingRiskyBlockReviewWrapperProps,
	shouldRenderDistributedEditingRiskyBlockReview,
} from '../';
import PluginPrePublishPanel from '../../plugin-pre-publish-panel';
import {
	DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES,
	DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES,
	DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS,
	DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES,
} from '../../../store/distributed-editing';

jest.mock( '@wordpress/data', () => {
	const path = require( 'path' );
	const packageJsonPath = require.resolve( '@wordpress/data/package.json' );
	const actual = jest.requireActual(
		path.join( path.dirname( packageJsonPath ), 'build/index.cjs' )
	);

	return {
		...actual,
		useDispatch: jest.fn(),
		useSelect: jest.fn(),
	};
} );
jest.mock( '../../../store', () => ( {
	store: { name: 'core/editor' },
} ) );
jest.mock( '@wordpress/block-editor', () => ( {
	__experimentalUseBlockPreview: jest.fn( () => ( {
		className: 'mock-block-preview',
	} ) ),
	store: { name: 'core/block-editor' },
} ) );

const RISKY_REVIEW_ITEM = {
	id: 'risk-html-added',
	blockClientId: 'block-risk-html-added',
	blockName: 'core/html',
	blockLabel: 'Custom HTML',
	changeKind: 'added_block',
	riskReason: 'kses_would_remove_script',
	proposedContentHash:
		'sha256:2222222222222222222222222222222222222222222222222222222222222222',
	ksesFilteredContentHash:
		'sha256:3333333333333333333333333333333333333333333333333333333333333333',
	reviewStatus:
		DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.PENDING_REVIEW,
	canApprove: true,
	canModifyAdopt: true,
	canReject: true,
	canDiscard: false,
	annotation: {
		visualTreatment: 'blue_warning_marker_with_focus_wash',
	},
	rawContent: '<script>secret</script>',
};

const REVIEW_STATE = {
	status: DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.REVIEW_REQUIRED,
	reviewItems: [ RISKY_REVIEW_ITEM ],
	reviewItemCount: 1,
	pendingReviewItemCount: 1,
	approvedReviewItemCount: 0,
	rejectedReviewItemCount: 0,
	hasPendingReviewItems: true,
	prePublishPanelRequired: true,
	saveButtonLabel: 'Save',
	saveClickAction:
		DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE,
	canExportLocalUpdates: false,
	requiresServerStateRefetch: false,
};

const SAVE_POLICY = {
	status: DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES.REVIEW_REQUIRED,
	reason: 'risky_block_review_required',
	saveButtonLabel: 'Save',
	clickAction:
		DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE,
	blocksNormalSavePost: true,
	opensPrePublishReview: false,
	requiresServerStateRefetch: false,
	saveButtonLocalChangesState: 'protected_local_changes_exportable',
	saveButtonReviewCheckpointState: 'review_required',
	saveButtonAuthoritativePostState: 'review_required_before_update',
	saveButtonStateSummaryText:
		'Protected local changes need review before WordPress can update the post.',
	saveButtonStateVocabulary: {
		localChangesState: 'protected_local_changes_exportable',
		reviewCheckpointState: 'review_required',
		authoritativePostState: 'review_required_before_update',
		localChangesText:
			'Protected local changes remain exportable from this editor.',
		reviewCheckpointText:
			'Review is required before WordPress can update the post.',
		authoritativePostText:
			'WordPress cannot update the post until risky changes are approved or removed.',
		summaryText:
			'Protected local changes need review before WordPress can update the post.',
		descriptorOnly: true,
		rawContentIncluded: false,
		exposesRawContent: false,
		exposesProofInternals: false,
		exposesReviewerIds: false,
		exposesSaverIds: false,
	},
	savesPost: false,
	shouldCallNormalSavePost: false,
	shouldCallRetrySaveEndpoint: false,
	dispatchesNotice: false,
	mutatesEditorContent: false,
	changesPostLock: false,
	claimsSaved: false,
};

function setupSelect( {
	reviewState = REVIEW_STATE,
	savePolicy = SAVE_POLICY,
} = {} ) {
	useSelect.mockImplementation( ( mapSelect ) =>
		mapSelect( () => ( {
			getDistributedEditingRiskyBlockReviewState: () => reviewState,
			getDistributedEditingSavePolicyState: () => savePolicy,
		} ) )
	);
}

function setupDispatch() {
	const actions = {
		__experimentalFocusDistributedEditingRiskyBlockReviewItem: jest
			.fn()
			.mockResolvedValue( {
				status: 'review_item_block_focused',
			} ),
		__experimentalLoadDistributedEditingRiskyBlockReviewItemDetail: jest
			.fn()
			.mockResolvedValue( {
				status: 'review_item_detail_loaded',
				item: {
					...RISKY_REVIEW_ITEM,
					proposedSourceDisplay:
						'&lt;script&gt;secret&lt;/script&gt;Script',
					ksesFilteredSourceDisplay: 'Script',
					rawContentIncluded: false,
					exposesRawContent: false,
				},
			} ),
		__experimentalOpenDistributedEditingRiskyBlockReview: jest
			.fn()
			.mockResolvedValue( {
				status: 'pre_publish_review_opened',
			} ),
		__experimentalResolveDistributedEditingRiskyBlockReviewItem: jest
			.fn()
			.mockResolvedValue( {
				status: 'review_item_resolved',
			} ),
		savePost: jest.fn(),
	};

	useDispatch.mockReturnValue( actions );

	return actions;
}

afterEach( () => {
	useDispatch.mockReset();
	useSelect.mockReset();
} );

describe( 'shouldRenderDistributedEditingRiskyBlockReview', () => {
	it( 'requires visible pending review items and a review status', () => {
		expect(
			shouldRenderDistributedEditingRiskyBlockReview( REVIEW_STATE )
		).toBe( true );
		expect(
			shouldRenderDistributedEditingRiskyBlockReview( {
				...REVIEW_STATE,
				reviewItems: [],
				reviewItemCount: 1,
				pendingReviewItemCount: 1,
				hasPendingReviewItems: true,
			} )
		).toBe( false );
		expect(
			shouldRenderDistributedEditingRiskyBlockReview( {
				...REVIEW_STATE,
				reviewItems: [
					{
						...RISKY_REVIEW_ITEM,
						reviewStatus:
							DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.REJECTED,
					},
				],
				pendingReviewItemCount: 0,
				hasPendingReviewItems: false,
			} )
		).toBe( false );
		expect(
			shouldRenderDistributedEditingRiskyBlockReview( {
				...REVIEW_STATE,
				status: DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.NO_REVIEW_REQUIRED,
			} )
		).toBe( false );
	} );
} );

describe( 'getDistributedEditingRiskyBlockReviewWrapperProps', () => {
	it( 'adds a content-free warning marker and wash to block wrapper props', () => {
		const wrapperProps = getDistributedEditingRiskyBlockReviewWrapperProps(
			{
				className: 'existing-wrapper',
				style: {
					boxShadow: '0 0 0 1px currentColor',
				},
			},
			RISKY_REVIEW_ITEM
		);

		expect( wrapperProps ).toMatchObject( {
			className:
				'existing-wrapper has-distributed-editing-risky-block-review',
			'aria-label': 'HTML review required for Custom HTML',
			'data-distributed-editing-risky-block-review': 'pending_review',
			'data-distributed-editing-risky-block-review-item-id':
				'risk-html-added',
			'data-distributed-editing-risky-block-review-label':
				'HTML review required for Custom HTML',
			'data-distributed-editing-risky-block-review-treatment':
				'blue_warning_marker_with_focus_wash',
		} );
		expect( wrapperProps.style.boxShadow ).toContain( '#2271b1' );
		expect( wrapperProps.style.boxShadow ).toContain(
			'rgba(34, 113, 177, 0.08)'
		);
	} );
} );

describe( 'Distributed Editing authorship focus', () => {
	const syncMeta = {
		authorship: {
			schema: 'de-rtc-authorship-v1',
			contentFree: true,
			blocks: [
				{
					path: [ 0 ],
					blockName: 'core/paragraph',
					serializedBlockHash:
						'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
					attributionKey: 'presence:author-a',
				},
				{
					path: [ 1 ],
					blockName: 'core/paragraph',
					serializedBlockHash:
						'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
					attributionKey: null,
					richText: {
						field: 'innerHTML',
						ranges: [
							{
								start: 0,
								end: 4,
								attributionKey: 'presence:author-a',
								changeKind: 'text_insert',
							},
							{
								start: 5,
								end: 11,
								attributionKey: 'presence:author-b',
								changeKind: 'format_change',
							},
						],
						rawContentIncluded: false,
					},
				},
				{
					path: [ 2 ],
					blockName: 'core/paragraph',
					serializedBlockHash:
						'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
					attributionKey: 'presence:author-b',
				},
			],
			rawContentIncluded: false,
			rawSessionKeyIncluded: false,
		},
	};

	it( 'classifies whole-block, mixed RichText, and dimmed focus states', () => {
		expect(
			getDistributedEditingAuthorshipFocusForBlockPath( {
				syncMeta,
				blockPath: [ 0 ],
				activeAttributionKey: 'presence:author-a',
			} )
		).toMatchObject( {
			active: true,
			status: 'focused',
			blockPathKey: '0',
		} );
		expect(
			getDistributedEditingAuthorshipFocusForBlockPath( {
				syncMeta,
				blockPath: [ 1 ],
				activeAttributionKey: 'presence:author-a',
			} )
		).toMatchObject( {
			active: true,
			status: 'mixed',
			blockPathKey: '1',
		} );
		expect(
			getDistributedEditingAuthorshipFocusForBlockPath( {
				syncMeta,
				blockPath: [ 2 ],
				activeAttributionKey: 'presence:author-a',
			} )
		).toMatchObject( {
			active: true,
			status: 'dimmed',
			blockPathKey: '2',
		} );
		expect(
			getDistributedEditingAuthorshipFocusForBlockPath( {
				syncMeta,
				blockPath: [ 0 ],
				activeAttributionKey: '',
			} )
		).toMatchObject( {
			active: false,
			status: 'inactive',
		} );
	} );

	it( 'adds Spotlight-style dimming props without exposing raw content', () => {
		const wrapperProps = getDistributedEditingAuthorshipFocusWrapperProps(
			{
				className: 'wp-block',
				style: {
					color: 'inherit',
				},
			},
			{
				active: true,
				status: 'dimmed',
				blockPathKey: '2',
			}
		);

		expect( wrapperProps ).toMatchObject( {
			'data-distributed-editing-authorship-focus': 'dimmed',
			'data-distributed-editing-authorship-focus-block-path': '2',
			'data-distributed-editing-authorship-focus-active': 'true',
		} );
		expect( wrapperProps.className ).toContain(
			'has-distributed-editing-authorship-focus--dimmed'
		);
		expect( wrapperProps.style ).toMatchObject( {
			color: 'inherit',
			opacity: 0.2,
		} );
		expect( JSON.stringify( wrapperProps ) ).not.toMatch(
			/rawContent|session_key|userId/
		);
	} );

	it( 'normalizes RichText authorship ranges as content-free spans', () => {
		expect(
			getDistributedEditingAuthorshipRichTextRanges(
				syncMeta.authorship.blocks[ 1 ]
			)
		).toEqual( [
			{
				start: 0,
				end: 4,
				attributionKey: 'presence:author-a',
				changeKind: 'text_insert',
			},
			{
				start: 5,
				end: 11,
				attributionKey: 'presence:author-b',
				changeKind: 'format_change',
			},
		] );
	} );
} );

describe( 'getDistributedEditingPendingGhostEntriesForBlockPath', () => {
	it( 'positions remote pending previews around the matching block path without filtering by role', () => {
		const rosterEntries = [
			{
				key: 'author-session',
				displayName: 'Author',
				relationship: 'other_user',
				permissions: {
					canSaveDangerousHtml: false,
				},
				pendingPreview: {
					available: true,
					items: [
						{
							previewId: 'added-html',
							blockPath: [ 1 ],
							blockName: 'core/html',
							changeKind: 'added_block',
							safePreviewText: 'Script',
						},
					],
				},
			},
			{
				key: 'same-user-tab',
				displayName: 'Same author in another tab',
				relationship: 'same_user_other_tab',
				pendingPreview: {
					available: true,
					items: [
						{
							previewId: 'modified-paragraph',
							blockPath: [ 0 ],
							blockName: 'core/paragraph',
							changeKind: 'modified_block',
							safePreviewText: 'Draft wording',
						},
					],
				},
			},
			{
				key: 'current-tab',
				displayName: 'Current tab',
				relationship: 'current_user_current_tab',
				pendingPreview: {
					available: true,
					items: [
						{
							previewId: 'local-only',
							blockPath: [ 0 ],
							changeKind: 'modified_block',
							safePreviewText: 'Local only',
						},
					],
				},
			},
		];
		const pendingGhosts =
			getDistributedEditingPendingGhostEntriesForBlockPath(
				rosterEntries,
				[ 0 ],
				{ siblingCount: 2 }
			);
		const followingSiblingGhosts =
			getDistributedEditingPendingGhostEntriesForBlockPath(
				rosterEntries,
				[ 1 ],
				{ siblingCount: 2 }
			);

		expect( pendingGhosts.before ).toHaveLength( 0 );
		expect( pendingGhosts.after ).toEqual( [
			expect.objectContaining( {
				displayName: 'Same author in another tab',
				key: 'same-user-tab-modified-paragraph-after',
				placement: 'after',
				safePreviewText: 'Draft wording',
			} ),
		] );
		expect( followingSiblingGhosts.before ).toEqual( [
			expect.objectContaining( {
				displayName: 'Author',
				key: 'author-session-added-html-before',
				placement: 'before',
				safePreviewText: 'Script',
			} ),
		] );
		expect( followingSiblingGhosts.after ).toHaveLength( 0 );
	} );

	it( 'renders an inserted preview before the following sibling and ignores other parents', () => {
		const pendingGhosts =
			getDistributedEditingPendingGhostEntriesForBlockPath(
				[
					{
						key: 'author-session',
						displayName: 'Author',
						relationship: 'other_user',
						pendingPreview: {
							available: true,
							items: [
								{
									previewId: 'nested-html',
									blockPath: [ 0, 1 ],
									blockName: 'core/html',
									changeKind: 'added_block',
									safePreviewText: 'Nested proposal',
								},
								{
									previewId: 'top-level-html',
									blockPath: [ 1 ],
									blockName: 'core/html',
									changeKind: 'added_block',
									safePreviewText: 'Top proposal',
								},
							],
						},
					},
				],
				[ 0, 1 ]
			);

		expect( pendingGhosts.before ).toEqual( [
			expect.objectContaining( {
				key: 'author-session-nested-html-before',
				placement: 'before',
				safePreviewText: 'Nested proposal',
			} ),
		] );
		expect( pendingGhosts.after ).toHaveLength( 0 );
	} );

	it( 'does not render ambiguous pending preview anchors in the canvas', () => {
		const pendingGhosts =
			getDistributedEditingPendingGhostEntriesForBlockPath(
				[
					{
						key: 'author-session',
						displayName: 'Author',
						relationship: 'other_user',
						pendingPreview: {
							available: true,
							items: [
								{
									previewId: 'ambiguous-change',
									blockPath: [ 1 ],
									blockName: 'core/paragraph',
									changeKind: 'unknown_change',
									safePreviewText: 'Ambiguous edit',
									anchorStatus: 'ambiguous',
								},
							],
						},
					},
				],
				[ 1 ]
			);

		expect( pendingGhosts.before ).toHaveLength( 0 );
		expect( pendingGhosts.after ).toHaveLength( 0 );
	} );

	it( 'uses presence heartbeat time when suppressing load-time stale ghosts', () => {
		const rosterEntries = [
			{
				key: 'stale-author-session',
				displayName: 'Stale author',
				relationship: 'other_user',
				presenceUpdatedAtGmt: '2026-05-30 08:59:00',
				pendingPreview: {
					available: true,
					items: [
						{
							previewId: 'stale-html',
							blockPath: [ 1 ],
							blockName: 'core/html',
							changeKind: 'added_block',
							safePreviewText: 'Stale ghost',
							updatedAtGmt: '2026-05-30 09:05:00',
							presenceUpdatedAtGmt: '2026-05-30 08:59:00',
						},
					],
				},
			},
		];

		const staleGhosts =
			getDistributedEditingPendingGhostEntriesForBlockPath(
				rosterEntries,
				[ 1 ],
				{
					minUpdatedAtMs: Date.parse( '2026-05-30T09:00:00Z' ),
				}
			);
		const freshGhosts =
			getDistributedEditingPendingGhostEntriesForBlockPath(
				[
					{
						...rosterEntries[ 0 ],
						presenceUpdatedAtGmt: '2026-05-30 09:01:00',
						pendingPreview: {
							...rosterEntries[ 0 ].pendingPreview,
							items: [
								{
									...rosterEntries[ 0 ].pendingPreview
										.items[ 0 ],
									presenceUpdatedAtGmt: '2026-05-30 09:01:00',
								},
							],
						},
					},
				],
				[ 1 ],
				{
					minUpdatedAtMs: Date.parse( '2026-05-30T09:00:00Z' ),
				}
			);

		expect( staleGhosts.before ).toHaveLength( 0 );
		expect( staleGhosts.after ).toHaveLength( 0 );
		expect( freshGhosts.before ).toEqual( [
			expect.objectContaining( {
				displayName: 'Stale author',
				safePreviewText: 'Stale ghost',
			} ),
		] );
	} );

	it( 'deduplicates identical pending previews reported by duplicate presence rows', () => {
		const duplicatePreview = {
			previewId: 'added-html',
			blockPath: [ 1 ],
			blockName: 'core/html',
			changeKind: 'added_block',
			safePreviewHtml: 'Script',
			safePreviewSerializedBlocks:
				'<!-- wp:html -->\nScript\n<!-- /wp:html -->',
			safePreviewText: 'Script',
		};
		const pendingGhosts =
			getDistributedEditingPendingGhostEntriesForBlockPath(
				[
					{
						key: 'author-session-a',
						displayName: 'Author',
						relationship: 'other_user',
						pendingPreview: {
							available: true,
							items: [ duplicatePreview ],
						},
					},
					{
						key: 'author-session-b',
						displayName: 'Author',
						relationship: 'other_user',
						pendingPreview: {
							available: true,
							items: [ duplicatePreview ],
						},
					},
				],
				[ 1 ],
				{ siblingCount: 2 }
			);

		expect( pendingGhosts.before ).toHaveLength( 1 );
		expect( pendingGhosts.before[ 0 ] ).toEqual(
			expect.objectContaining( {
				displayName: 'Author',
				safePreviewText: 'Script',
			} )
		);
	} );
} );

describe( 'DistributedEditingPendingGhostBlockListPreview', () => {
	it( 'moves author information into a hover/focus callout and marks the pending block treatment', () => {
		render(
			<DistributedEditingPendingGhostBlockListPreview
				ghost={ {
					blockName: 'core/html',
					changeKind: 'added_block',
					displayName: 'Author',
					key: 'author-added-html',
					safePreviewText: 'Script',
				} }
			/>
		);

		const ghost = screen.getByRole( 'note', {
			name: 'Pending edit by Author in core/html',
		} );
		const tooltip = screen.getByRole( 'tooltip', { hidden: true } );

		expect( ghost ).not.toHaveAttribute( 'title' );
		expect( ghost ).toHaveAttribute(
			'aria-describedby',
			tooltip.getAttribute( 'id' )
		);
		expect( ghost ).toHaveAttribute(
			'data-distributed-editing-pending-ghost-callout',
			'hover-focus'
		);
		expect( ghost ).toHaveAttribute(
			'data-distributed-editing-pending-ghost-visual-treatment',
			'subtle-wash-border'
		);
		expect( ghost ).toHaveAttribute(
			'data-distributed-editing-pending-ghost-placement',
			'block-list'
		);
		expect( ghost ).toHaveAttribute(
			'data-distributed-editing-pending-ghost-raw-content',
			'false'
		);
		expect( ghost ).toHaveAttribute(
			'data-distributed-editing-pending-ghost-author-inline',
			'false'
		);
		expect( ghost ).toHaveAttribute( 'tabindex', '0' );
		expect( tooltip ).toHaveAttribute(
			'data-distributed-editing-pending-ghost-author-callout',
			'true'
		);
		expect( tooltip ).toHaveAttribute( 'aria-hidden', 'true' );
		expect( tooltip ).toHaveTextContent( 'Author' );
		expect( tooltip ).toHaveTextContent( 'core/html' );
		expect( tooltip ).toHaveTextContent( 'Pending added block' );
		expect( screen.getByText( 'Script' ) ).toBeInTheDocument();
	} );

	it( 'renders sanitized Custom HTML preview content inside the ghost block', () => {
		render(
			<DistributedEditingPendingGhostBlockListPreview
				ghost={ {
					blockName: 'core/html',
					changeKind: 'added_block',
					displayName: 'Author',
					key: 'author-added-html',
					safePreviewHtml: 'Script',
					safePreviewSerializedBlocks:
						'<!-- wp:html -->\nScript\n<!-- /wp:html -->',
					safePreviewText: 'Script',
				} }
			/>
		);

		const ghost = screen.getByRole( 'note', {
			name: 'Pending edit by Author in core/html',
		} );

		expect( ghost ).toHaveTextContent( 'Script' );
		expect(
			screen.getByTestId(
				'distributed-editing-pending-ghost-safe-html-preview'
			)
		).toBeInTheDocument();
	} );

	it( 'dims pending ghosts from other sessions during authorship focus', () => {
		render(
			<DistributedEditingPendingGhostBlockListPreview
				authorshipFocusAttributionKey="presence:focused-author"
				ghost={ {
					attributionKey: 'presence:other-author',
					blockName: 'core/paragraph',
					changeKind: 'modified_block',
					displayName: 'Other Author',
					key: 'other-modified-paragraph',
					safePreviewText: 'Other pending paragraph',
				} }
			/>
		);

		const ghost = screen.getByRole( 'note', {
			name: 'Pending edit by Other Author in core/paragraph',
		} );

		expect( ghost ).toHaveAttribute(
			'data-distributed-editing-pending-ghost-authorship-focus',
			'dimmed'
		);
		expect( ghost ).toHaveStyle( { opacity: '0.2' } );
	} );
} );

describe( 'DistributedEditingRiskyBlockReviewStatusChrome', () => {
	it( 'opens the pre-publish review without saving', async () => {
		const user = userEvent.setup();
		const actions = setupDispatch();
		setupSelect();

		render( <DistributedEditingRiskyBlockReviewStatusChrome /> );

		expect( screen.getByText( 'HTML review required' ) ).toBeVisible();
		await user.click(
			screen.getByRole( 'button', { name: 'Review HTML' } )
		);

		expect(
			actions.__experimentalOpenDistributedEditingRiskyBlockReview
		).toHaveBeenCalledTimes( 1 );
		expect( actions.savePost ).not.toHaveBeenCalled();
	} );

	it( 'does not render when stale review metadata has no actionable row', () => {
		setupDispatch();
		setupSelect( {
			reviewState: {
				...REVIEW_STATE,
				reviewItems: [],
				reviewItemCount: 1,
				pendingReviewItemCount: 1,
				hasPendingReviewItems: true,
			},
		} );

		render( <DistributedEditingRiskyBlockReviewStatusChrome /> );

		expect(
			screen.queryByText( 'HTML review required' )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: 'Review HTML' } )
		).not.toBeInTheDocument();
	} );
} );

describe( 'DistributedEditingRiskyBlockReviewListViewMarker', () => {
	it( 'renders a content-free accessible marker for the matching pending block', () => {
		setupSelect();

		render(
			<DistributedEditingRiskyBlockReviewListViewMarker
				block={ { clientId: 'block-risk-html-added' } }
			/>
		);

		const marker = screen.getByRole( 'img', {
			name: 'HTML review required for Custom HTML',
		} );

		expect( marker ).toBeVisible();
		expect( marker ).toHaveAttribute(
			'data-distributed-editing-risky-block-review-list-view-marker'
		);
		expect( marker ).toHaveAttribute(
			'data-distributed-editing-risky-block-review-item-id',
			'risk-html-added'
		);
		expect(
			screen.queryByText( '<script>secret</script>' )
		).not.toBeInTheDocument();
	} );

	it( 'does not render when the matching block has no pending review item', () => {
		setupSelect();

		render(
			<DistributedEditingRiskyBlockReviewListViewMarker
				block={ { clientId: 'block-without-risk' } }
			/>
		);

		expect(
			screen.queryByRole( 'img', {
				name: 'HTML review required for Custom HTML',
			} )
		).not.toBeInTheDocument();
	} );
} );

describe( 'DistributedEditingRiskyBlockReviewPrePublishPanel', () => {
	it( 'renders a hash-only pre-publish Fill and wires focus plus separated review controls', async () => {
		const user = userEvent.setup();
		const actions = setupDispatch();
		setupSelect();

		render(
			<SlotFillProvider>
				<DistributedEditingRiskyBlockReviewPrePublishPanel />
				<PluginPrePublishPanel.Slot />
			</SlotFillProvider>
		);

		expect( screen.getByText( 'HTML review' ) ).toBeVisible();
		expect(
			screen.getAllByText( '1 highlighted block needs HTML review.' )
				.length
		).toBeGreaterThanOrEqual( 1 );
		expect(
			screen.getByText(
				'This highlighted block needs HTML review before it can be included.'
			)
		).toBeVisible();
		expect(
			screen.getByText(
				'Protected local changes remain exportable from this editor.'
			)
		).toBeVisible();
		expect(
			screen.getAllByText( '1 highlighted block needs HTML review.' )
				.length
		).toBeGreaterThanOrEqual( 2 );
		expect(
			screen.queryByText(
				'Review is required before WordPress can update the post.'
			)
		).not.toBeInTheDocument();
		expect(
			screen.getByText(
				'WordPress cannot update the post until risky changes are approved or removed.'
			)
		).toBeVisible();
		expect( screen.getByText( 'Custom HTML' ) ).toBeVisible();
		const panel = screen.getByRole( 'region', {
			name: 'HTML review state',
		} );

		expect( panel ).toHaveAttribute(
			'data-distributed-editing-save-local-changes-state',
			'protected_local_changes_exportable'
		);
		expect( panel ).toHaveAttribute(
			'data-distributed-editing-save-review-checkpoint-state',
			'review_required'
		);
		expect( panel ).toHaveAttribute(
			'data-distributed-editing-save-authoritative-post-state',
			'review_required_before_update'
		);
		expect( panel ).toHaveAttribute(
			'data-distributed-editing-save-state-summary',
			'Protected local changes need review before WordPress can update the post.'
		);
		expect(
			screen.queryByText( '<script>secret</script>' )
		).not.toBeInTheDocument();

		await user.click(
			screen.getByRole( 'button', { name: 'Jump to Custom HTML' } )
		);
		expect(
			actions.__experimentalFocusDistributedEditingRiskyBlockReviewItem
		).toHaveBeenCalledWith( 'risk-html-added' );

		await user.click(
			screen.getByRole( 'button', {
				name: 'Approve HTML change for Custom HTML',
			} )
		);
		expect(
			actions.__experimentalResolveDistributedEditingRiskyBlockReviewItem
		).toHaveBeenCalledWith( {
			reviewItemId: 'risk-html-added',
			decision: 'approved',
		} );

		await user.click(
			screen.getByRole( 'button', {
				name: 'Modify HTML change for Custom HTML',
			} )
		);
		expect(
			actions.__experimentalLoadDistributedEditingRiskyBlockReviewItemDetail
		).toHaveBeenCalledWith( 'risk-html-added' );
		const reviewedSource = screen.getByRole( 'textbox', {
			name: 'Edited HTML for Custom HTML',
		} );
		expect( reviewedSource ).toHaveValue( '<script>secret</script>Script' );
		await user.clear( reviewedSource );
		await user.type(
			reviewedSource,
			'<!-- wp:html --><strong>Reviewed</strong><!-- /wp:html -->'
		);
		await user.click(
			screen.getByRole( 'button', { name: 'Adopt edited HTML' } )
		);
		expect(
			actions.__experimentalResolveDistributedEditingRiskyBlockReviewItem
		).toHaveBeenCalledWith( {
			reviewItemId: 'risk-html-added',
			decision: 'modify-adopt',
			reviewedBlockSource:
				'<!-- wp:html --><strong>Reviewed</strong><!-- /wp:html -->',
		} );

		await user.click(
			screen.getByRole( 'button', {
				name: 'Reject HTML change for Custom HTML',
			} )
		);
		expect(
			actions.__experimentalResolveDistributedEditingRiskyBlockReviewItem
		).toHaveBeenCalledWith( {
			reviewItemId: 'risk-html-added',
			decision: 'rejected',
		} );
		expect( actions.savePost ).not.toHaveBeenCalled();
	} );

	it( 'does not mount an empty pre-publish panel from stale review metadata', () => {
		setupDispatch();
		setupSelect( {
			reviewState: {
				...REVIEW_STATE,
				reviewItems: [],
				reviewItemCount: 1,
				pendingReviewItemCount: 1,
				hasPendingReviewItems: true,
			},
		} );

		render(
			<SlotFillProvider>
				<DistributedEditingRiskyBlockReviewPrePublishPanel />
				<PluginPrePublishPanel.Slot />
			</SlotFillProvider>
		);

		expect( screen.queryByText( 'HTML review' ) ).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'region', {
				name: 'HTML review state',
			} )
		).not.toBeInTheDocument();
	} );
} );

describe( 'DistributedEditingRiskyBlockReviewPanel', () => {
	it( 'uses discard wording for a proposer who cannot approve unfiltered HTML', async () => {
		const user = userEvent.setup();
		const onResolve = jest.fn();

		render(
			<DistributedEditingRiskyBlockReviewPanel
				onResolve={ onResolve }
				reviewState={ {
					...REVIEW_STATE,
					reviewItems: [
						{
							...RISKY_REVIEW_ITEM,
							canApprove: false,
							canModifyAdopt: false,
							canReject: false,
							canDiscard: true,
						},
					],
				} }
				savePolicy={ SAVE_POLICY }
			/>
		);

		expect(
			screen.queryByRole( 'button', {
				name: 'Approve HTML change for Custom HTML',
			} )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', {
				name: 'Modify HTML change for Custom HTML',
			} )
		).not.toBeInTheDocument();

		await user.click(
			screen.getByRole( 'button', {
				name: 'Discard HTML change for Custom HTML',
			} )
		);
		expect( onResolve ).toHaveBeenCalledWith(
			expect.objectContaining( { id: 'risk-html-added' } ),
			'discarded'
		);
	} );

	it( 'requires server-backed admin review detail before approve or reject actions appear', async () => {
		const user = userEvent.setup();
		const onLoadDetail = jest.fn().mockResolvedValue( {
			item: {
				...RISKY_REVIEW_ITEM,
				id: 'de-rtc-review-detail-gate',
				proposedSourceDisplay:
					'&lt;script&gt;alert(1);&lt;/script&gt;Script',
				ksesFilteredSourceDisplay: 'Script',
			},
		} );
		const onResolve = jest.fn();

		render(
			<DistributedEditingRiskyBlockReviewPanel
				onLoadDetail={ onLoadDetail }
				onResolve={ onResolve }
				reviewState={ {
					...REVIEW_STATE,
					reviewItems: [
						{
							...RISKY_REVIEW_ITEM,
							id: 'de-rtc-review-detail-gate',
							proposedSourceDisplay: undefined,
							ksesFilteredSourceDisplay: undefined,
						},
					],
				} }
				savePolicy={ SAVE_POLICY }
			/>
		);

		expect(
			screen.getByRole( 'button', {
				name: 'Review HTML change for Custom HTML',
			} )
		).toBeVisible();
		expect(
			screen.queryByRole( 'button', {
				name: 'Approve HTML change for Custom HTML',
			} )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', {
				name: 'Reject HTML change for Custom HTML',
			} )
		).not.toBeInTheDocument();

		await user.click(
			screen.getByRole( 'button', {
				name: 'Review HTML change for Custom HTML',
			} )
		);

		expect( onLoadDetail ).toHaveBeenCalledWith(
			expect.objectContaining( { id: 'de-rtc-review-detail-gate' } )
		);
		expect(
			await screen.findByText( '<script>alert(1);</script>Script' )
		).toBeVisible();
		expect( screen.getByText( 'Script' ) ).toBeVisible();
		expect(
			screen.getByRole( 'button', {
				name: 'Approve HTML change for Custom HTML',
			} )
		).toBeVisible();
		expect(
			screen.getByRole( 'button', {
				name: 'Reject HTML change for Custom HTML',
			} )
		).toBeVisible();
	} );

	it( 'renders proposal timeline and document movement for pending items', () => {
		render(
			<DistributedEditingRiskyBlockReviewPanel
				reviewState={ {
					...REVIEW_STATE,
					currentServerVersion: '33',
					reviewItems: [
						{
							...RISKY_REVIEW_ITEM,
							baseSyncVersion: '32',
							serverSyncVersion: '32',
							createdAtGmt: '0000-00-00T00:00:00',
							updatedAtGmt: '2026-06-25T16:32:00',
							expiresAtGmt: '2099-07-02T16:32:00',
							proposerDisplayName: 'author',
						},
					],
				} }
				savePolicy={ SAVE_POLICY }
			/>
		);

		expect(
			screen.getByText( 'Proposal version 32; current version 33.' )
		).toBeVisible();
		expect(
			screen.getByText( '1 saved change since this was proposed.' )
		).toBeVisible();
		expect( screen.getByText( /Proposed by author/ ) ).toBeVisible();
		expect( screen.getByText( /Expires in/ ) ).toBeVisible();
	} );

	it( 'collapses the local review item when a matching server item exists', () => {
		render(
			<DistributedEditingRiskyBlockReviewPanel
				reviewState={ {
					...REVIEW_STATE,
					reviewItems: [
						{
							...RISKY_REVIEW_ITEM,
							id: 'kses-review-local',
							blockPath: [ 1 ],
						},
						{
							...RISKY_REVIEW_ITEM,
							id: 'de-rtc-review-server',
							blockClientId: '',
							blockPath: [ 1 ],
							canApprove: false,
							canModifyAdopt: false,
							canReject: false,
							canDiscard: true,
						},
					],
					reviewItemCount: 2,
					pendingReviewItemCount: 1,
				} }
				savePolicy={ SAVE_POLICY }
			/>
		);

		expect(
			screen.getAllByText(
				'This highlighted block needs HTML review before it can be included.'
			)
		).toHaveLength( 1 );
		expect(
			screen.getByRole( 'button', {
				name: 'Discard HTML change for Custom HTML',
			} )
		).toBeVisible();
		expect(
			screen.queryByRole( 'button', {
				name: 'Reject HTML change for Custom HTML',
			} )
		).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'button', {
				name: 'Jump to Custom HTML',
			} )
		).toBeEnabled();
	} );

	it( 'renders resolved review state without enabling completed item controls', () => {
		const resolvedReviewState = {
			...REVIEW_STATE,
			status: DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.REVIEW_RESOLVED,
			pendingReviewItemCount: 0,
			approvedReviewItemCount: 1,
			reviewItems: [
				{
					...RISKY_REVIEW_ITEM,
					reviewStatus:
						DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.APPROVED_FOR_RETRY_SAVE,
				},
			],
		};

		render(
			<DistributedEditingRiskyBlockReviewPanel
				reviewState={ resolvedReviewState }
				savePolicy={ {
					clickAction:
						DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE,
				} }
			/>
		);

		expect(
			screen.getByText( 'HTML review is resolved for this update.' )
		).toBeVisible();
		expect(
			screen.getByText( 'Custom HTML was approved for WordPress Save.' )
		).toBeVisible();
		expect(
			screen.getByRole( 'button', {
				name: 'Approve HTML change for Custom HTML',
			} )
		).toHaveAttribute( 'aria-disabled', 'true' );
		expect(
			screen.getByRole( 'button', {
				name: 'Reject HTML change for Custom HTML',
			} )
		).toHaveAttribute( 'aria-disabled', 'true' );
	} );
} );
