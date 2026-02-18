/**
 * Internal dependencies
 */
import { getActionableStatus } from '../../../navigation-link/shared';

// These tests verify getActionableStatus returns the correct label and intent
// that NavigationBlockBadge uses to display text badges in the navigation list view.

describe( 'Navigation List View Badges', () => {
	describe( 'Error badges', () => {
		it( 'should show "Missing page" badge for missing entity', () => {
			const status = getActionableStatus( {
				url: '/some-page',
				type: 'page',
				hasBinding: true,
				isEntityAvailable: false,
			} );

			expect( status ).not.toBeNull();
			expect( status.intent ).toBe( 'error' );
			expect( status.label ).toBe( 'Missing page' );
		} );

		it( 'should show "No link selected" badge when there is no URL', () => {
			const status = getActionableStatus( {
				url: '',
			} );

			expect( status ).not.toBeNull();
			expect( status.intent ).toBe( 'error' );
			expect( status.label ).toBe( 'No link selected' );
		} );

		it( 'should show "Trash" badge for trashed links', () => {
			const status = getActionableStatus( {
				url: '/my-page',
				type: 'page',
				entityStatus: 'trash',
			} );

			expect( status ).not.toBeNull();
			expect( status.intent ).toBe( 'error' );
			expect( status.label ).toBe( 'Trash' );
		} );
	} );

	describe( 'Warning badges', () => {
		it( 'should show "Draft" badge for draft links', () => {
			const status = getActionableStatus( {
				url: '/my-draft',
				type: 'post',
				entityStatus: 'draft',
			} );

			expect( status ).not.toBeNull();
			expect( status.intent ).toBe( 'warning' );
			expect( status.label ).toBe( 'Draft' );
		} );

		it( 'should show "Pending" badge for pending links', () => {
			const status = getActionableStatus( {
				url: '/my-post',
				type: 'post',
				entityStatus: 'pending',
			} );

			expect( status ).not.toBeNull();
			expect( status.intent ).toBe( 'warning' );
			expect( status.label ).toBe( 'Pending' );
		} );

		it( 'should show "Scheduled" badge for scheduled links', () => {
			const status = getActionableStatus( {
				url: '/my-post',
				type: 'post',
				entityStatus: 'future',
			} );

			expect( status ).not.toBeNull();
			expect( status.intent ).toBe( 'warning' );
			expect( status.label ).toBe( 'Scheduled' );
		} );
	} );

	describe( 'No badge shown for healthy links', () => {
		it( 'should show no badge for published links', () => {
			const status = getActionableStatus( {
				url: '/my-page',
				type: 'page',
				entityStatus: 'publish',
			} );

			expect( status ).toBeNull();
		} );

		it( 'should show no badge for external links', () => {
			const status = getActionableStatus( {
				url: 'https://example.com',
			} );

			expect( status ).toBeNull();
		} );

		it( 'should show no badge for private links', () => {
			const status = getActionableStatus( {
				url: '/my-page',
				type: 'page',
				entityStatus: 'private',
			} );

			expect( status ).toBeNull();
		} );
	} );

	describe( 'Badge priority', () => {
		it( 'should show "Missing" badge (not "No link selected") when entity is missing', () => {
			const status = getActionableStatus( {
				url: '',
				type: 'page',
				hasBinding: true,
				isEntityAvailable: false,
			} );

			expect( status.intent ).toBe( 'error' );
			expect( status.label ).toBe( 'Missing page' );
		} );
	} );
} );
