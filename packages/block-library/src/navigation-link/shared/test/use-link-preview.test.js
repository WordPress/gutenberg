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
			const result = computeDisplayUrl( { linkUrl: url } );
			expect( result ).toEqual( {
				displayUrl: url,
				isExternal: true,
			} );
		} );

		test.each( [
			[ 'www.test.com', 'URLs without protocol' ],
			[ 'google.com', 'domain-only URLs without protocol' ],
			[ 'https://google.com', 'external URLs' ],
			[ 'https://google.com/search', 'external URLs with paths' ],
		] )(
			'should mark %s as external regardless of other attributes (%s)',
			( url ) => {
				const result = computeDisplayUrl( { linkUrl: url } );
				expect( result.isExternal ).toBe( true );
			}
		);
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

		it( 'should treat same-origin URLs as internal', () => {
			const result = computeDisplayUrl( {
				linkUrl: 'https://example.com/my-page',
				siteUrl: 'https://example.com',
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
				const result = computeDisplayUrl( { linkUrl: url } );
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
			const result = computeDisplayUrl( { linkUrl: url } );
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

it( 'should show "Internal link" badge for hash links even when type is present', () => {
	const badges = computeBadges( {
		url: '#section',
		type: 'page', // Bug: type is set from previous link
		isExternal: false,
	} );

	// Should prioritize hash link detection over type
	expect( badges ).toContainEqual( {
		label: 'Internal link',
		intent: 'default',
	} );
	// Should NOT show Page badge
	expect( badges ).not.toContainEqual( {
		label: 'Page',
		intent: 'default',
	} );
} );

test.each( [
	[ 'www.test.com', 'URLs without protocol' ],
	[ 'google.com', 'domain-only URLs without protocol' ],
	[ 'https://google.com', 'external URLs' ],
	[ 'https://google.com/search', 'external URLs with paths' ],
] )(
	'should show "External link" badge for %s even when type is present (%s)',
	( url ) => {
		const badges = computeBadges( {
			url,
			type: 'page', // Bug: type is set incorrectly
			isExternal: true,
		} );

		// Should prioritize external link detection over type
		expect( badges ).toContainEqual( {
			label: 'External link',
			intent: 'default',
		} );
		// Should NOT show Page badge
		expect( badges ).not.toContainEqual( {
			label: 'Page',
			intent: 'default',
		} );
	}
);

it( 'should show "Page" badge for internal custom links', () => {
	const badges = computeBadges( {
		url: 'http://localhost:8888/test',
		type: 'custom',
		isExternal: false,
	} );

	// Should show Page badge for internal custom links
	expect( badges ).toContainEqual( {
		label: 'Page',
		intent: 'default',
	} );
	// Should NOT show Custom badge
	expect( badges ).not.toContainEqual( {
		label: 'Custom',
		intent: 'default',
	} );
} );
