/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import SavePublishPanels from '../index';

jest.mock( '@wordpress/data', () => ( {
	useDispatch: jest.fn(),
	useSelect: jest.fn(),
} ) );

jest.mock( '@wordpress/components', () => {
	const { createElement } = require( '@wordpress/element' );

	return {
		Button: ( { children, ...props } ) =>
			createElement( 'button', props, children ),
		createSlotFill: () => ( {
			Fill: ( { children } ) =>
				createElement(
					'div',
					{ 'data-testid': 'actions-fill' },
					children
				),
			Slot: () =>
				createElement( 'div', { 'data-testid': 'actions-slot' } ),
		} ),
	};
} );

jest.mock( '../../entities-saved-states', () => {
	const { createElement } = require( '@wordpress/element' );

	return function MockEntitiesSavedStates() {
		return createElement( 'div', null, 'Entities saved states' );
	};
} );

jest.mock( '../../post-publish-panel', () => {
	const { createElement } = require( '@wordpress/element' );

	return function MockPostPublishPanel( { forcePrePublishExtension } ) {
		return createElement(
			'div',
			{
				'data-force-pre-publish-extension': String(
					Boolean( forcePrePublishExtension )
				),
				'data-testid': 'post-publish-panel',
			},
			'Post publish panel'
		);
	};
} );

jest.mock( '../../plugin-pre-publish-panel', () => ( {
	Slot: () => null,
} ) );

jest.mock( '../../plugin-post-publish-panel', () => ( {
	Slot: () => null,
} ) );

jest.mock( '../../../store', () => ( {
	store: {},
} ) );

const defaultSelectors = {
	getDistributedEditingSavePolicyState: () => ( {
		opensPrePublishReview: false,
		clickAction: 'continue_save',
	} ),
	getDistributedEditingRiskyBlockReviewState: () => ( {
		prePublishPanelRequired: false,
		pendingReviewItemCount: 0,
	} ),
	getDistributedEditingSessionState: () => ( {
		remoteChangesReviewPrePublishPanelRequired: false,
	} ),
	hasNonPostEntityChanges: () => false,
	isCurrentPostPublished: () => true,
	isEditedPostDirty: () => false,
	isEditedPostPublishable: () => false,
	isPublishSidebarOpened: () => true,
};

function setupSelect( selectorOverrides = {} ) {
	const selectors = {
		...defaultSelectors,
		...selectorOverrides,
	};

	useSelect.mockImplementation( ( mapSelect ) =>
		mapSelect( () => selectors )
	);
}

describe( 'SavePublishPanels', () => {
	beforeEach( () => {
		useDispatch.mockReturnValue( {
			closePublishSidebar: jest.fn(),
			togglePublishSidebar: jest.fn(),
		} );
		setupSelect();
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'forces the pre-publish extension when risky-block review has visible pending items', () => {
		setupSelect( {
			getDistributedEditingRiskyBlockReviewState: () => ( {
				prePublishPanelRequired: true,
				pendingReviewItemCount: 1,
			} ),
		} );

		render(
			<SavePublishPanels
				closeEntitiesSavedStates={ jest.fn() }
				isEntitiesSavedStatesOpen={ false }
				setEntitiesSavedStatesCallback={ jest.fn() }
			/>
		);

		expect( screen.getByTestId( 'post-publish-panel' ) ).toHaveAttribute(
			'data-force-pre-publish-extension',
			'true'
		);
	} );

	it( 'does not force the pre-publish extension for stale count-free risky-block review state', () => {
		setupSelect( {
			getDistributedEditingRiskyBlockReviewState: () => ( {
				prePublishPanelRequired: true,
				pendingReviewItemCount: 0,
			} ),
		} );

		render(
			<SavePublishPanels
				closeEntitiesSavedStates={ jest.fn() }
				isEntitiesSavedStatesOpen={ false }
				setEntitiesSavedStatesCallback={ jest.fn() }
			/>
		);

		expect( screen.getByTestId( 'post-publish-panel' ) ).toHaveAttribute(
			'data-force-pre-publish-extension',
			'false'
		);
	} );
} );
