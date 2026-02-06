/**
 * Internal dependencies
 */
import { computeDisplayUrl, computeBadges } from '../use-link-preview';

describe( 'computeDisplayUrl', () => {
	describe( 'external links', () => {
		it( 'should mark URLs without protocol as external', () => {
			const result = computeDisplayUrl( 'www.test.com' );
			expect( result ).toEqual( {
				displayUrl: 'www.test.com',
				isExternal: true,
			} );
		} );

		it( 'should mark domain-only URLs without protocol as external', () => {
			const result = computeDisplayUrl( 'google.com' );
			expect( result ).toEqual( {
				displayUrl: 'google.com',
				isExternal: true,
			} );
		} );

		it( 'should handle external URLs', () => {
			const result = computeDisplayUrl( 'https://google.com' );
			expect( result ).toEqual( {
				displayUrl: 'https://google.com/search',
				isExternal: true,
			} );
		} );

		it( 'should handle external URLs with paths', () => {
			const result = computeDisplayUrl( 'https://google.com/search' );
			expect( result ).toEqual( {
				displayUrl: 'https://google.com/search',
				isExternal: true,
			} );
		} );
	} );

	describe( 'internal links', () => {
		it( 'should NOT mark relative paths as external', () => {
			const result = computeDisplayUrl( '/page' );
			expect( result.isExternal ).toBe( false );
		} );

		it( 'should NOT mark anchor links as external', () => {
			const result = computeDisplayUrl( '#section' );
			expect( result.isExternal ).toBe( false );
		} );
	} );

	describe( 'special protocols and edge cases', () => {
		it( 'should mark mailto links as external', () => {
			const result = computeDisplayUrl( 'mailto:test@example.com' );
			expect( result ).toEqual( {
				displayUrl: 'mailto:test@example.com',
				isExternal: true,
			} );
		} );

		it( 'should mark tel links as external', () => {
			const result = computeDisplayUrl( 'tel:5555555' );
			expect( result ).toEqual( {
				displayUrl: 'tel:5555555',
				isExternal: true,
			} );
		} );

		it( 'should handle empty URL', () => {
			const result = computeDisplayUrl( '' );
			expect( result ).toEqual( {
				displayUrl: '',
				isExternal: false,
			} );
		} );

		it( 'should handle null URL', () => {
			const result = computeDisplayUrl( null );
			expect( result ).toEqual( {
				displayUrl: '',
				isExternal: false,
			} );
		} );
	} );
} );

describe( 'computeBadges', () => {
	describe( 'kind badges', () => {
		it( 'should show "External link" badge for external links', () => {
			const badges = computeBadges( {
				url: 'https://google.com',
				isExternal: true,
			} );

			expect( badges ).toContainEqual( {
				label: 'External link',
				intent: 'default',
			} );
		} );

		it( 'should show entity type badge for internal entity links', () => {
			const badges = computeBadges( {
				url: '/my-page',
				type: 'page',
				isExternal: false,
			} );

			expect( badges ).toContainEqual( {
				label: 'Page',
				intent: 'default',
			} );
		} );

		it( 'should show "Internal link" badge for hash links', () => {
			const badges = computeBadges( {
				url: '#section',
				isExternal: false,
			} );

			expect( badges ).toContainEqual( {
				label: 'Internal link',
				intent: 'default',
			} );
		} );

		it( 'should show page badge for relative paths', () => {
			const badges = computeBadges( {
				url: '/relative-path',
				isExternal: false,
			} );

			expect( badges ).toContainEqual( {
				label: 'Page',
				intent: 'default',
			} );
		} );
	} );

	describe( 'status badges', () => {
		it( 'should show "No link selected" when URL is empty', () => {
			const badges = computeBadges( {
				url: '',
			} );

			expect( badges ).toContainEqual( {
				label: 'No link selected',
				intent: 'error',
			} );
		} );

		it( 'should show "Missing page" for broken entity bindings', () => {
			const badges = computeBadges( {
				url: '/some-page',
				type: 'page',
				hasBinding: true,
				isEntityAvailable: false,
			} );

			expect( badges ).toContainEqual( {
				label: 'Missing page',
				intent: 'error',
			} );
		} );

		it( 'should show "Published" badge for published entities', () => {
			const badges = computeBadges( {
				url: '/my-page',
				type: 'page',
				entityStatus: 'publish',
			} );

			expect( badges ).toContainEqual( {
				label: 'Published',
				intent: 'success',
			} );
		} );

		it( 'should show "Draft" badge for draft entities', () => {
			const badges = computeBadges( {
				url: '/my-draft',
				type: 'post',
				entityStatus: 'draft',
			} );

			expect( badges ).toContainEqual( {
				label: 'Draft',
				intent: 'warning',
			} );
		} );
	} );
} );
