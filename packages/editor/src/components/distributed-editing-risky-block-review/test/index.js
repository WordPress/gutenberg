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
	DistributedEditingRiskyBlockReviewListViewMarker,
	DistributedEditingRiskyBlockReviewPanel,
	DistributedEditingRiskyBlockReviewStatusChrome,
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
	saveButtonLabel: 'Review changes',
	saveClickAction:
		DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.OPEN_PRE_PUBLISH_REVIEW,
	canExportLocalUpdates: true,
	requiresServerStateRefetch: false,
};

const SAVE_POLICY = {
	status: DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES.REVIEW_REQUIRED,
	reason: 'risky_block_review_required',
	saveButtonLabel: 'Review changes',
	clickAction:
		DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.OPEN_PRE_PUBLISH_REVIEW,
	blocksNormalSavePost: true,
	opensPrePublishReview: true,
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
	it( 'requires review items and a review status', () => {
		expect(
			shouldRenderDistributedEditingRiskyBlockReview( REVIEW_STATE )
		).toBe( true );
		expect(
			shouldRenderDistributedEditingRiskyBlockReview( {
				...REVIEW_STATE,
				reviewItemCount: 0,
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
			'aria-label': 'HTML review required before Save for Custom HTML',
			'data-distributed-editing-risky-block-review': 'pending_review',
			'data-distributed-editing-risky-block-review-item-id':
				'risk-html-added',
			'data-distributed-editing-risky-block-review-label':
				'HTML review required before Save for Custom HTML',
			'data-distributed-editing-risky-block-review-treatment':
				'blue_warning_marker_with_focus_wash',
		} );
		expect( wrapperProps.style.boxShadow ).toContain( '#2271b1' );
		expect( wrapperProps.style.boxShadow ).toContain(
			'rgba(34, 113, 177, 0.08)'
		);
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
			screen.getByRole( 'button', { name: 'Review changes' } )
		);

		expect(
			actions.__experimentalOpenDistributedEditingRiskyBlockReview
		).toHaveBeenCalledTimes( 1 );
		expect( actions.savePost ).not.toHaveBeenCalled();
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
			name: 'HTML review required before Save for Custom HTML',
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
				name: 'HTML review required before Save for Custom HTML',
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
			screen.getByText(
				'1 highlighted block needs HTML review before Save can update the post.'
			)
		).toBeVisible();
		expect(
			screen.getByText(
				'This highlighted block needs HTML review before Save can update the post.'
			)
		).toBeVisible();
		expect(
			screen.getByText(
				'Protected local changes remain exportable from this editor.'
			)
		).toBeVisible();
		expect(
			screen.getByText(
				'Review is required before WordPress can update the post.'
			)
		).toBeVisible();
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
} );

describe( 'DistributedEditingRiskyBlockReviewPanel', () => {
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
