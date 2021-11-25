/**
 * Internal dependencies
 */
import { updateNavigationLinkBlockAttributes } from '../edit';

describe( 'edit', () => {
	describe( 'updateNavigationLinkBlockAttributes', () => {
		// Data shapes are linked to fetchLinkSuggestions from
		// core-data/src/fetch/__experimental-fetch-link-suggestions.js.
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

			updateNavigationLinkBlockAttributes(
				linkSuggestion,
				setAttributes
			);
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
			updateNavigationLinkBlockAttributes(
				linkSuggestion,
				setAttributes
			);
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
			updateNavigationLinkBlockAttributes(
				linkSuggestion,
				setAttributes
			);
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
			updateNavigationLinkBlockAttributes(
				linkSuggestion,
				setAttributes
			);
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
			updateNavigationLinkBlockAttributes(
				linkSuggestion,
				setAttributes
			);
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
				title: 'Portfolio Tag',
				type: 'portfolio_tag',
				url: 'http://wordpress.local/portfolio_tag/PortfolioTag/',
			};
			updateNavigationLinkBlockAttributes(
				linkSuggestion,
				setAttributes
			);
			expect( setAttributes ).toHaveBeenCalledWith( {
				id: 4,
				kind: 'taxonomy',
				opensInNewTab: false,
				label: 'Portfolio Tag',
				type: 'portfolio_tag',
				url: 'http://wordpress.local/portfolio_tag/PortfolioTag/',
			} );
		} );

		it( 'can update a custom category link', () => {
			const setAttributes = jest.fn();
			const linkSuggestion = {
				id: 2,
				kind: 'taxonomy',
				opensInNewTab: false,
				title: 'Portfolio Category',
				type: 'portfolio_category',
				url:
					'http://wordpress.local/portfolio_category/Portfolio-category/',
			};
			updateNavigationLinkBlockAttributes(
				linkSuggestion,
				setAttributes
			);
			expect( setAttributes ).toHaveBeenCalledWith( {
				id: 2,
				kind: 'taxonomy',
				opensInNewTab: false,
				label: 'Portfolio Category',
				type: 'portfolio_category',
				url:
					'http://wordpress.local/portfolio_category/Portfolio-category/',
			} );
		} );

		it( 'can update a post format and ignores id slug', () => {
			const setAttributes = jest.fn();
			const linkSuggestion = {
				id: 'video',
				kind: 'taxonomy',
				opensInNewTab: false,
				title: 'Video',
				type: 'post-format',
				url: 'http://wordpress.local/type/video/',
			};
			updateNavigationLinkBlockAttributes(
				linkSuggestion,
				setAttributes
			);
			// Post_format returns a slug ID value from the Search API
			// we do not persist this ID since we expect this value to be a post or term ID.
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
				updateNavigationLinkBlockAttributes(
					linkSuggestion,
					setAttributes
				);
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
				updateNavigationLinkBlockAttributes(
					linkSuggestion,
					setAttributes
				);
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
				updateNavigationLinkBlockAttributes(
					linkSuggestion,
					setAttributes
				);
				expect( setAttributes ).toHaveBeenCalledWith( {
					opensInNewTab: false,
					label: 'mailto:foo@example.com',
					kind: 'custom',
					url: 'mailto:foo@example.com',
					type: 'mailto',
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
				updateNavigationLinkBlockAttributes(
					linkSuggestion,
					setAttributes
				);
				expect( setAttributes ).toHaveBeenCalledWith( {
					opensInNewTab: false,
					label: '#foo',
					kind: 'custom',
					url: '#foo',
					type: 'internal',
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
				updateNavigationLinkBlockAttributes(
					linkSuggestion,
					setAttributes
				);
				expect( setAttributes ).toHaveBeenCalledWith( {
					opensInNewTab: false,
					label: 'tel:5555555',
					kind: 'custom',
					url: 'tel:5555555',
					type: 'tel',
				} );
			} );
		} );

		describe( 'link label', () => {
			// https://github.com/WordPress/gutenberg/pull/19461
			it( 'sets the url as a label if title is not provided', () => {
				const setAttributes = jest.fn();
				const linkSuggestion = {
					id: 'www.wordpress.org/foo bar',
					opensInNewTab: false,
					title: '',
					type: 'URL',
					url: 'https://www.wordpress.org',
				};
				updateNavigationLinkBlockAttributes(
					linkSuggestion,
					setAttributes
				);
				expect( setAttributes ).toHaveBeenCalledWith( {
					opensInNewTab: false,
					label: 'www.wordpress.org',
					kind: 'custom',
					url: 'https://www.wordpress.org',
				} );
			} );
			it( 'does not replace label when editing url without protocol', () => {
				const setAttributes = jest.fn();
				const linkSuggestion = {
					id: 'www.wordpress.org',
					opensInNewTab: false,
					title: 'Custom Title',
					type: 'URL',
					url: 'wordpress.org',
				};
				updateNavigationLinkBlockAttributes(
					linkSuggestion,
					setAttributes
				);
				expect( setAttributes ).toHaveBeenCalledWith( {
					opensInNewTab: false,
					label: 'Custom Title',
					kind: 'custom',
					url: 'wordpress.org',
				} );
			} );
			it( 'does not replace label when editing url with protocol', () => {
				const setAttributes = jest.fn();
				const linkSuggestion = {
					id: 'www.wordpress.org',
					opensInNewTab: false,
					title: 'Custom Title',
					type: 'URL',
					url: 'https://wordpress.org',
				};
				updateNavigationLinkBlockAttributes(
					linkSuggestion,
					setAttributes
				);
				expect( setAttributes ).toHaveBeenCalledWith( {
					opensInNewTab: false,
					label: 'Custom Title',
					kind: 'custom',
					url: 'https://wordpress.org',
				} );
			} );
			// https://github.com/WordPress/gutenberg/pull/18617
			it( 'label is javascript escaped', () => {
				const setAttributes = jest.fn();
				const linkSuggestion = {
					opensInNewTab: false,
					title: '<Navigation />',
					type: 'URL',
					url: 'https://wordpress.local?p=1',
				};
				updateNavigationLinkBlockAttributes(
					linkSuggestion,
					setAttributes
				);
				expect( setAttributes ).toHaveBeenCalledWith( {
					opensInNewTab: false,
					label: '&lt;Navigation /&gt;',
					kind: 'custom',
					url: 'https://wordpress.local?p=1',
				} );
			} );
			// https://github.com/WordPress/gutenberg/pull/19679
			it( 'url when escaped is still an actual link', () => {
				const setAttributes = jest.fn();
				const linkSuggestion = {
					id: 'http://wordpress.org/?s=',
					opensInNewTab: false,
					title: 'Custom Title',
					type: 'URL',
					url: 'http://wordpress.org/?s=<>',
				};
				updateNavigationLinkBlockAttributes(
					linkSuggestion,
					setAttributes
				);
				expect( setAttributes ).toHaveBeenCalledWith( {
					opensInNewTab: false,
					label: 'Custom Title',
					kind: 'custom',
					url: 'http://wordpress.org/?s=%3C%3E',
				} );
			} );
		} );

		describe( 'does not overwrite props when only some props are passed', () => {
			it( 'id is retained after toggling opensInNewTab', () => {
				const mockState = {};
				const setAttributes = jest.fn( ( attr ) =>
					Object.assign( mockState, attr )
				);
				const linkSuggestion = {
					opensInNewTab: false,
					id: 1337,
					url: 'https://wordpress.local/menu-test/',
					kind: 'post-type',
					title: 'Menu Test',
					type: 'post',
				};

				updateNavigationLinkBlockAttributes(
					linkSuggestion,
					setAttributes,
					mockState
				);
				expect( mockState ).toEqual( {
					id: 1337,
					label: 'Menu Test',
					opensInNewTab: false,
					kind: 'post-type',
					type: 'post',
					url: 'https://wordpress.local/menu-test/',
				} );
				// Click on the existing link control, and toggle opens new tab.
				updateNavigationLinkBlockAttributes(
					{
						url: 'https://wordpress.local/menu-test/',
						opensInNewTab: true,
					},
					setAttributes,
					mockState
				);
				expect( mockState ).toEqual( {
					id: 1337,
					label: 'Menu Test',
					opensInNewTab: true,
					kind: 'post-type',
					type: 'post',
					url: 'https://wordpress.local/menu-test/',
				} );
			} );
			it( 'id is retained after editing url', () => {
				const mockState = {};
				const setAttributes = jest.fn( ( attr ) =>
					Object.assign( mockState, attr )
				);
				const linkSuggestion = {
					opensInNewTab: false,
					id: 1337,
					url: 'https://wordpress.local/menu-test/',
					kind: 'post-type',
					title: 'Menu Test',
					type: 'post',
				};

				updateNavigationLinkBlockAttributes(
					linkSuggestion,
					setAttributes,
					mockState
				);
				expect( mockState ).toEqual( {
					id: 1337,
					label: 'Menu Test',
					opensInNewTab: false,
					kind: 'post-type',
					type: 'post',
					url: 'https://wordpress.local/menu-test/',
				} );
				// Click on the existing link control, and toggle opens new tab.
				updateNavigationLinkBlockAttributes(
					{
						url: 'https://wordpress.local/foo/',
						opensInNewTab: false,
					},
					setAttributes,
					mockState
				);
				expect( mockState ).toEqual( {
					id: 1337,
					label: 'Menu Test',
					opensInNewTab: false,
					kind: 'post-type',
					type: 'post',
					url: 'https://wordpress.local/foo/',
				} );
			} );
		} );
	} );
} );
