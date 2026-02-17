/**
 * Internal dependencies
 */
import {
	computeBadges,
	getActionableStatus,
} from '../../../navigation-link/shared';

// These tests verify the integration between computeBadges and getActionableStatus
// to ensure indicators show correctly for navigation items in list view.

describe( 'List View Indicators Integration', () => {
	describe( 'Error status indicators', () => {
		it( 'should return error status for missing entity', () => {
			const badges = computeBadges( {
				url: '/some-page',
				type: 'page',
				hasBinding: true,
				isEntityAvailable: false,
			} );

			const status = getActionableStatus( {
				url: '/some-page',
				type: 'page',
				hasBinding: true,
				isEntityAvailable: false,
			} );

			expect( status ).not.toBeNull();
			expect( status.intent ).toBe( 'error' );
			expect( status.label ).toBe( 'Missing page' );

			// Verify badge and status are consistent
			const errorBadge = badges.find(
				( badge ) => badge.intent === 'error'
			);
			expect( errorBadge.label ).toBe( status.label );
		} );

		it( 'should return error status for no URL', () => {
			const status = getActionableStatus( {
				url: '',
			} );

			expect( status ).not.toBeNull();
			expect( status.intent ).toBe( 'error' );
			expect( status.label ).toBe( 'No link selected' );
		} );

		it( 'should return error status for trash', () => {
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

	describe( 'Warning status indicators', () => {
		it( 'should return warning status for draft entity', () => {
			const status = getActionableStatus( {
				url: '/my-draft',
				type: 'post',
				entityStatus: 'draft',
			} );

			expect( status ).not.toBeNull();
			expect( status.intent ).toBe( 'warning' );
			expect( status.label ).toBe( 'Draft' );
		} );

		it( 'should return warning status for pending entity', () => {
			const status = getActionableStatus( {
				url: '/my-post',
				type: 'post',
				entityStatus: 'pending',
			} );

			expect( status ).not.toBeNull();
			expect( status.intent ).toBe( 'warning' );
			expect( status.label ).toBe( 'Pending' );
		} );

		it( 'should return warning status for scheduled entity', () => {
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

	describe( 'No indicator for valid items', () => {
		it( 'should return null for published entity', () => {
			const status = getActionableStatus( {
				url: '/my-page',
				type: 'page',
				entityStatus: 'publish',
			} );

			expect( status ).toBeNull();
		} );

		it( 'should return null for external links', () => {
			const status = getActionableStatus( {
				url: 'https://example.com',
			} );

			expect( status ).toBeNull();
		} );

		it( 'should return null for private posts', () => {
			const status = getActionableStatus( {
				url: '/my-page',
				type: 'page',
				entityStatus: 'private',
			} );

			expect( status ).toBeNull();
		} );
	} );

	describe( 'Priority when multiple issues present', () => {
		it( 'should prioritize missing entity over no URL', () => {
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
