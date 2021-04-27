/**
 * Internal dependencies
 */
import { updateNavigationLinkBlockAttributes } from '../edit';

describe( 'edit', () => {
	describe( 'updateNavigationLinkBlockAttributes', () => {
		// data shapes are linked to fetchLinkSuggestions from
		// core-data/src/fetch/__experimental-fetch-link-suggestions.js
		it( 'can update a post link', () => {
			const setAttributes = jest.fn();
			const linkSuggestion = {
				opensInNewTab: false,
				id: 1337,
				url: 'https://wordpress.local/menu-test/',
				kind: 'post-type',
				title: 'Menu Test',
				type: 'post',
			};

			updateNavigationLinkBlockAttributes( linkSuggestion, {
				setAttributes,
			} );
			expect( setAttributes ).toHaveBeenCalledWith( {
				id: 1337,
				label: 'Menu Test',
				opensInNewTab: false,
				kind: 'post-type',
				type: 'post',
				url: 'https://wordpress.local/menu-test/',
			} );
		} );

		it( 'can update a page link', () => {
			const setAttributes = jest.fn();
			const linkSuggestion = {
				id: 2,
				kind: 'post-type',
				opensInNewTab: false,
				title: 'Sample Page',
				type: 'page',
				url: 'http://wordpress.local/sample-page/',
			};
			updateNavigationLinkBlockAttributes( linkSuggestion, {
				setAttributes,
			} );
			expect( setAttributes ).toHaveBeenCalledWith( {
				id: 2,
				kind: 'post-type',
				label: 'Sample Page',
				opensInNewTab: false,
				type: 'page',
				url: 'http://wordpress.local/sample-page/',
			} );
		} );

		it( 'can update a tag link', () => {
			const setAttributes = jest.fn();
			const linkSuggestion = {
				id: 15,
				kind: 'taxonomy',
				opensInNewTab: false,
				title: 'bar',
				type: 'post_tag',
				url: 'http://wordpress.local/tag/bar/',
			};
			updateNavigationLinkBlockAttributes( linkSuggestion, {
				setAttributes,
			} );
			// TODO: existing bug: if url is not set, placeholder has "tag" and set value has "post_tag"
			expect( setAttributes ).toHaveBeenCalledWith( {
				id: 15,
				kind: 'taxonomy',
				opensInNewTab: false,
				label: 'bar',
				type: 'tag',
				url: 'http://wordpress.local/tag/bar/',
			} );
		} );

		it( 'can update a category link', () => {
			const setAttributes = jest.fn();
			const linkSuggestion = {
				id: 9,
				kind: 'taxonomy',
				opensInNewTab: false,
				title: 'Cats',
				type: 'category',
				url: 'http://wordpress.local/category/cats/',
			};
			updateNavigationLinkBlockAttributes( linkSuggestion, {
				setAttributes,
			} );
			expect( setAttributes ).toHaveBeenCalledWith( {
				id: 9,
				kind: 'taxonomy',
				opensInNewTab: false,
				label: 'Cats',
				type: 'category',
				url: 'http://wordpress.local/category/cats/',
			} );
		} );

		it( 'can update a custom post type link', () => {
			const setAttributes = jest.fn();
			const linkSuggestion = {
				id: 131,
				kind: 'post-type',
				opensInNewTab: false,
				title: 'Fall',
				type: 'portfolio',
				url: 'http://wordpress.local/portfolio/fall/',
			};
			updateNavigationLinkBlockAttributes( linkSuggestion, {
				setAttributes,
			} );
			expect( setAttributes ).toHaveBeenCalledWith( {
				id: 131,
				kind: 'post-type',
				opensInNewTab: false,
				label: 'Fall',
				type: 'portfolio',
				url: 'http://wordpress.local/portfolio/fall/',
			} );
		} );

		it( 'can update a custom tag link', () => {
			const setAttributes = jest.fn();
			const linkSuggestion = {
				id: 4,
				kind: 'taxonomy',
				opensInNewTab: false,
				title: 'PortfolioTag',
				type: 'portfolio_tag',
				url: 'http://wordpress.local/portfolio_tag/portfoliotag/',
			};
			updateNavigationLinkBlockAttributes( linkSuggestion, {
				setAttributes,
			} );
			expect( setAttributes ).toHaveBeenCalledWith( {
				id: 4,
				kind: 'taxonomy',
				opensInNewTab: false,
				label: 'PortfolioTag',
				type: 'portfolio_tag',
				url: 'http://wordpress.local/portfolio_tag/portfoliotag/',
			} );
		} );

		it( 'can update a custom category link', () => {
			const setAttributes = jest.fn();
			const linkSuggestion = {
				id: 2,
				kind: 'taxonomy',
				opensInNewTab: false,
				title: 'Portfolioz Category',
				type: 'portfolio_category',
				url:
					'http://wordpress.local/portfolio_category/portfolioz-category/',
			};
			updateNavigationLinkBlockAttributes( linkSuggestion, {
				setAttributes,
			} );
			expect( setAttributes ).toHaveBeenCalledWith( {
				id: 2,
				kind: 'taxonomy',
				opensInNewTab: false,
				label: 'Portfolioz Category',
				type: 'portfolio_category',
				url:
					'http://wordpress.local/portfolio_category/portfolioz-category/',
			} );
		} );

		it( 'can update a post format', () => {
			const setAttributes = jest.fn();
			const linkSuggestion = {
				id: 'video',
				kind: undefined, //TODO also fix this in experimental fetch link suggestions
				opensInNewTab: false,
				title: 'Video',
				type: 'post-format',
				url: 'http://wordpress.local/type/video/',
			};
			updateNavigationLinkBlockAttributes( linkSuggestion, {
				setAttributes,
			} );
			expect( setAttributes ).toHaveBeenCalledWith( {
				kind: 'taxonomy',
				opensInNewTab: false,
				label: 'Video',
				type: 'post_format',
				url: 'http://wordpress.local/type/video/',
			} );
		} );

		describe( 'various link protocols save as custom links', () => {
			it( 'when typing a url, but not selecting a search suggestion', () => {
				const setAttributes = jest.fn();
				const linkSuggestion = {
					opensInNewTab: false,
					url: 'www.wordpress.org',
				};
				updateNavigationLinkBlockAttributes( linkSuggestion, {
					setAttributes,
				} );
				expect( setAttributes ).toHaveBeenCalledWith( {
					opensInNewTab: false,
					url: 'www.wordpress.org',
					label: 'www.wordpress.org',
					kind: 'custom',
				} );
			} );

			it( 'url', () => {
				const setAttributes = jest.fn();
				const linkSuggestion = {
					id: 'www.wordpress.org',
					opensInNewTab: false,
					title: 'www.wordpress.org',
					type: 'URL',
					url: 'http://www.wordpress.org',
				};
				updateNavigationLinkBlockAttributes( linkSuggestion, {
					setAttributes,
				} );
				expect( setAttributes ).toHaveBeenCalledWith( {
					opensInNewTab: false,
					label: 'www.wordpress.org',
					kind: 'custom',
					url: 'http://www.wordpress.org',
				} );
			} );

			it( 'email', () => {
				const setAttributes = jest.fn();
				const linkSuggestion = {
					id: 'mailto:foo@example.com',
					opensInNewTab: false,
					title: 'mailto:foo@example.com',
					type: 'mailto',
					url: 'mailto:foo@example.com',
				};
				updateNavigationLinkBlockAttributes( linkSuggestion, {
					setAttributes,
				} );
				expect( setAttributes ).toHaveBeenCalledWith( {
					opensInNewTab: false,
					label: 'mailto:foo@example.com',
					kind: 'custom',
					url: 'mailto:foo@example.com',
				} );
			} );

			it( 'anchor links (internal links)', () => {
				const setAttributes = jest.fn();
				const linkSuggestion = {
					id: '#foo',
					opensInNewTab: false,
					title: '#foo',
					type: 'internal',
					url: '#foo',
				};
				updateNavigationLinkBlockAttributes( linkSuggestion, {
					setAttributes,
				} );
				expect( setAttributes ).toHaveBeenCalledWith( {
					opensInNewTab: false,
					label: '#foo',
					kind: 'custom',
					url: '#foo',
				} );
			} );

			it( 'telephone', () => {
				const setAttributes = jest.fn();
				const linkSuggestion = {
					id: 'tel:5555555',
					opensInNewTab: false,
					title: 'tel:5555555',
					type: 'tel',
					url: 'tel:5555555',
				};
				updateNavigationLinkBlockAttributes( linkSuggestion, {
					setAttributes,
				} );
				expect( setAttributes ).toHaveBeenCalledWith( {
					opensInNewTab: false,
					label: 'tel:5555555',
					kind: 'custom',
					url: 'tel:5555555',
				} );
			} );
		} );
	} );
} );
