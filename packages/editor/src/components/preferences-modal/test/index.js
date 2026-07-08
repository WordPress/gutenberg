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

	it( 'shows collaboration notification controls', async () => {
		const user = setupActiveModal();
		await user.click( screen.getByRole( 'tab', { name: 'General' } ) );

		expect(
			await screen.findByRole( 'checkbox', {
				name: 'Collaborator joined',
			} )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'checkbox', {
				name: 'Collaborator left',
			} )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'checkbox', {
				name: 'Post updated',
			} )
		).toBeInTheDocument();
	} );
} );
