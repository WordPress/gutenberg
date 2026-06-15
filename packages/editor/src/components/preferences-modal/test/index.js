/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useViewportMatch } from '@wordpress/compose';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as interfaceStore } from '@wordpress/interface';
import { store as coreStore } from '@wordpress/core-data';
import { SlotFillProvider } from '@wordpress/components';

/**
 * Internal dependencies
 */
import EditPostPreferencesModal from '../';
import { store as editorStore } from '../../../store';
import { lock } from '../../../lock-unlock';

// This allows us to tweak the returned value on each test.
jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );
jest.mock( '@wordpress/compose/src/hooks/use-viewport-match', () => jest.fn() );

function setupActiveModal( preferences = {} ) {
	const user = userEvent.setup();
	const editorSelectors = {
		getCurrentPostType: () => 'post',
		getEditedPostAttribute: () => 'post',
		isPublishSidebarEnabled: () => false,
	};
	lock( editorSelectors, {
		getEditorSettings: () => ( {
			richEditingEnabled: true,
		} ),
		isCollaborationEnabledForCurrentPost: () => true,
	} );

	useViewportMatch.mockReturnValue( true );
	useSelect.mockImplementation( ( mapSelect ) =>
		mapSelect( ( store ) => {
			if ( store === interfaceStore ) {
				return {
					isModalActive: () => true,
				};
			}
			if ( store === editorStore ) {
				return editorSelectors;
			}
			if ( store === preferencesStore ) {
				return {
					get: ( scope, featureName ) => preferences[ featureName ],
				};
			}
			if ( store === coreStore ) {
				return {
					getEntityRecords: () => [],
					getPostType: () => ( { supports: {} } ),
					getThemeSupports: () => ( {} ),
				};
			}
		} )
	);

	render(
		<SlotFillProvider>
			<EditPostPreferencesModal />
		</SlotFillProvider>
	);

	return user;
}

describe( 'EditPostPreferencesModal', () => {
	beforeEach( () => {
		useSelect.mockReset();
		useViewportMatch.mockReset();
	} );

	it( 'should not render when the modal is not active', () => {
		useSelect.mockImplementation( () => false );
		render( <EditPostPreferencesModal /> );
		expect(
			screen.queryByRole( 'dialog', { name: 'Preferences' } )
		).not.toBeInTheDocument();
	} );

	it( 'hides granular collaboration notification controls when the master notification control is off', async () => {
		const user = setupActiveModal( {
			showCollaborationNotifications: false,
		} );
		await user.click( screen.getByRole( 'tab', { name: 'General' } ) );

		expect(
			await screen.findByRole( 'checkbox', {
				name: 'Show collaboration notifications',
			} )
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'checkbox', {
				name: 'Show collaborator presence notifications',
			} )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'checkbox', {
				name: 'Show post update notifications',
			} )
		).not.toBeInTheDocument();
	} );

	it( 'shows granular collaboration notification controls when the master notification control is on', async () => {
		const user = setupActiveModal( {
			showCollaborationNotifications: true,
		} );
		await user.click( screen.getByRole( 'tab', { name: 'General' } ) );

		expect(
			await screen.findByRole( 'checkbox', {
				name: 'Show collaboration notifications',
			} )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'checkbox', {
				name: 'Show collaborator presence notifications',
			} )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'checkbox', {
				name: 'Show post update notifications',
			} )
		).toBeInTheDocument();
	} );
} );
