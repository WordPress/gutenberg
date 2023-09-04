/**
 * External dependencies
 */
import { render, screen, within } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import EditPostPreferencesModal from '../';

// This allows us to tweak the returned value on each test.
jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );
jest.mock( '@wordpress/compose/src/hooks/use-viewport-match', () => jest.fn() );

describe( 'EditPostPreferencesModal', () => {
	describe( 'should match snapshot when the modal is active', () => {
		afterEach( () => {
			useViewportMatch.mockClear();
		} );
		it( 'large viewports', async () => {
			useSelect.mockImplementation( () => [ true, true, false ] );
			useViewportMatch.mockImplementation( () => true );
			render( <EditPostPreferencesModal /> );
			const tabPanel = await screen.findByRole( 'tabpanel', {
				name: 'General',
			} );

			expect(
				within( tabPanel ).getByLabelText(
					'Include pre-publish checklist'
				)
			).toBeInTheDocument();
		} );
		it( 'small viewports', async () => {
			useSelect.mockImplementation( () => [ true, true, false ] );
			useViewportMatch.mockImplementation( () => false );
			render( <EditPostPreferencesModal /> );
			const dialog = screen.getByRole( 'dialog', {
				name: 'Preferences',
			} );

			expect(
				screen.queryByRole( 'tabpanel', {
					name: 'General',
				} )
			).not.toBeInTheDocument();

			expect(
				within( dialog ).queryByLabelText(
					'Include pre-publish checklist'
				)
			).not.toBeInTheDocument();
		} );
	} );

	it( 'should not render when the modal is not active', () => {
		useSelect.mockImplementation( () => [ false, false, false ] );
		render( <EditPostPreferencesModal /> );
		expect(
			screen.queryByRole( 'dialog', { name: 'Preferences' } )
		).not.toBeInTheDocument();
	} );
} );
