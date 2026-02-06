/**
 * Internal dependencies
 */
import { computeDisplayUrl, computeBadges } from '../use-link-preview';

describe( 'computeDisplayUrl', () => {
	describe( 'external links', () => {
		test.each( [
			[ 'www.test.com', 'URLs without protocol' ],
			[ 'google.com', 'domain-only URLs without protocol' ],
			[ 'https://google.com', 'external URLs' ],
			[ 'https://google.com/search', 'external URLs with paths' ],
		] )( 'should mark %s as external (%s)', ( url ) => {
			const result = computeDisplayUrl( url );
			expect( result ).toEqual( {
				displayUrl: url,
				isExternal: true,
			} );
		} );
	} );

	describe( 'internal links', () => {
		it( 'should mark relative paths as internal', () => {
			const result = computeDisplayUrl( '/page' );
			expect( result.isExternal ).toBe( false );
		} );

		it( 'should mark anchor links as internal', () => {
			const result = computeDisplayUrl( '#section' );
			expect( result.isExternal ).toBe( false );
		} );

		it( 'should treat entity links as internal', () => {
			const result = computeDisplayUrl( 'https://example.com/my-page', {
				type: 'page',
			} );
			expect( result.isExternal ).toBe( false );
		} );

		it( 'should treat links with entity binding as internal', () => {
			const result = computeDisplayUrl( 'https://example.com/my-post', {
				hasBinding: true,
			} );
			expect( result.isExternal ).toBe( false );
		} );
	} );

	describe( 'special protocols and edge cases', () => {
		test.each( [
			[ 'mailto:test@example.com', 'mailto:test@example.com', true ],
			[ 'tel:5555555', 'tel:5555555', true ],
		] )(
			'should mark %s as external',
			( url, expectedDisplay, expectedExternal ) => {
				const result = computeDisplayUrl( url );
				expect( result ).toEqual( {
					displayUrl: expectedDisplay,
					isExternal: expectedExternal,
				} );
			}
		);

		test.each( [
			[ '', 'empty URL' ],
			[ null, 'null URL' ],
		] )( 'should handle %s', ( url ) => {
			const result = computeDisplayUrl( url );
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
