/**
 * Internal dependencies
 */
import { updateAttributes } from '../update-attributes';

describe( 'updateAttributes', () => {
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

		updateAttributes( linkSuggestion, setAttributes );
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
		updateAttributes( linkSuggestion, setAttributes );
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
		updateAttributes( linkSuggestion, setAttributes );
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
		updateAttributes( linkSuggestion, setAttributes );
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
		updateAttributes( linkSuggestion, setAttributes );
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
		updateAttributes( linkSuggestion, setAttributes );
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
			url: 'http://wordpress.local/portfolio_category/Portfolio-category/',
		};
		updateAttributes( linkSuggestion, setAttributes );
		expect( setAttributes ).toHaveBeenCalledWith( {
			id: 2,
			kind: 'taxonomy',
			opensInNewTab: false,
			label: 'Portfolio Category',
			type: 'portfolio_category',
			url: 'http://wordpress.local/portfolio_category/Portfolio-category/',
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
		updateAttributes( linkSuggestion, setAttributes );
		// post_format returns a slug ID value from the Search API
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
			updateAttributes( linkSuggestion, setAttributes );
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
			updateAttributes( linkSuggestion, setAttributes );
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
			updateAttributes( linkSuggestion, setAttributes );
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
			updateAttributes( linkSuggestion, setAttributes );
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
			updateAttributes( linkSuggestion, setAttributes );
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
			updateAttributes( linkSuggestion, setAttributes );
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
			updateAttributes( linkSuggestion, setAttributes );
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
			updateAttributes( linkSuggestion, setAttributes );
			expect( setAttributes ).toHaveBeenCalledWith( {
				opensInNewTab: false,
				label: 'Custom Title',
				kind: 'custom',
				url: 'https://wordpress.org',
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
			updateAttributes( linkSuggestion, setAttributes );
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

			updateAttributes( linkSuggestion, setAttributes, mockState );
			expect( mockState ).toEqual( {
				id: 1337,
				label: 'Menu Test',
				opensInNewTab: false,
				kind: 'post-type',
				type: 'post',
				url: 'https://wordpress.local/menu-test/',
			} );
			// Click on the existing link control, and toggle opens new tab.
			// Note: When only opensInNewTab is changed (no URL change), ID should be retained
			updateAttributes(
				{
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
		it( 'id is removed after editing url', () => {
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

			updateAttributes( linkSuggestion, setAttributes, mockState );
			expect( mockState ).toEqual( {
				id: 1337,
				label: 'Menu Test',
				opensInNewTab: false,
				kind: 'post-type',
				type: 'post',
				url: 'https://wordpress.local/menu-test/',
			} );
			// Click on the existing link control, and change URL.
			// Note: When URL is changed without a new ID, the original ID should be removed
			updateAttributes(
				{
					url: 'https://wordpress.local/foo/',
					opensInNewTab: false,
				},
				setAttributes,
				mockState
			);
			expect( mockState ).toEqual( {
				id: undefined,
				label: 'Menu Test',
				opensInNewTab: false,
				kind: 'custom',
				type: 'custom',
				url: 'https://wordpress.local/foo/',
			} );
		} );
	} );

	describe( 'ID handling when URL is manually changed', () => {
		describe( 'URL modifications that should sever the entity link', () => {
			it( 'should remove ID when URL path is changed', () => {
				const setAttributes = jest.fn();
				const blockAttributes = {
					id: 123,
					type: 'page',
					kind: 'post-type',
					url: 'https://example.com/original-page',
				};

				const updatedValue = {
					url: 'https://example.com/different-page',
				};

				updateAttributes(
					updatedValue,
					setAttributes,
					blockAttributes
				);

				expect( setAttributes ).toHaveBeenCalledWith(
					expect.objectContaining( {
						id: undefined,
						kind: 'custom',
						type: 'custom',
						url: 'https://example.com/different-page',
					} )
				);
			} );

			it( 'should remove ID when changing to relative URL that does not match the path', () => {
				const setAttributes = jest.fn();
				const blockAttributes = {
					id: 123,
					type: 'page',
					kind: 'post-type',
					url: 'https://example.com/hello-world/',
				};

				const updatedValue = {
					url: '/different-page',
				};

				updateAttributes(
					updatedValue,
					setAttributes,
					blockAttributes
				);

				expect( setAttributes ).toHaveBeenCalledWith(
					expect.objectContaining( {
						id: undefined,
						kind: 'custom',
						type: 'custom',
						url: '/different-page',
					} )
				);
			} );

			it( 'should remove ID when URL domain is changed', () => {
				const setAttributes = jest.fn();
				const blockAttributes = {
					id: 123,
					type: 'page',
					kind: 'post-type',
					url: 'https://example.com/page',
				};

				const updatedValue = {
					url: 'https://different-site.com/page',
				};

				updateAttributes(
					updatedValue,
					setAttributes,
					blockAttributes
				);

				expect( setAttributes ).toHaveBeenCalledWith(
					expect.objectContaining( {
						id: undefined,
						kind: 'custom',
						type: 'custom',
						url: 'https://different-site.com/page',
					} )
				);
			} );

			it( 'should remove ID when plain permalink post ID is changed', () => {
				const setAttributes = jest.fn();
				const blockAttributes = {
					id: 123,
					type: 'page',
					kind: 'post-type',
					url: 'https://example.com/?p=123',
				};

				const updatedValue = {
					url: 'https://example.com/?p=456',
				};

				updateAttributes(
					updatedValue,
					setAttributes,
					blockAttributes
				);

				expect( setAttributes ).toHaveBeenCalledWith(
					expect.objectContaining( {
						id: undefined,
						kind: 'custom',
						type: 'custom',
						url: 'https://example.com/?p=456',
					} )
				);
			} );

			it( 'should remove ID when changing from plain permalink to different plain permalink', () => {
				const setAttributes = jest.fn();
				const blockAttributes = {
					id: 123,
					type: 'page',
					kind: 'post-type',
					url: 'https://example.com/?p=123',
				};

				const updatedValue = {
					url: 'https://example.com/?page_id=456',
				};

				updateAttributes(
					updatedValue,
					setAttributes,
					blockAttributes
				);

				expect( setAttributes ).toHaveBeenCalledWith(
					expect.objectContaining( {
						id: undefined,
						kind: 'custom',
						type: 'custom',
						url: 'https://example.com/?page_id=456',
					} )
				);
			} );
		} );

		describe( 'URL modifications that should preserve the entity link', () => {
			it( 'should preserve ID when changing to relative URL that matches the path', () => {
				const setAttributes = jest.fn();
				const blockAttributes = {
					id: 123,
					type: 'page',
					kind: 'post-type',
					url: 'https://example.com/hello-world/',
				};

				const updatedValue = {
					url: '/hello-world/',
				};

				updateAttributes(
					updatedValue,
					setAttributes,
					blockAttributes
				);

				expect( setAttributes ).toHaveBeenCalledWith(
					expect.objectContaining( {
						url: '/hello-world/',
					} )
				);
				// Should not sever the entity link when relative URL matches the path
				expect( setAttributes ).not.toHaveBeenCalledWith(
					expect.objectContaining( {
						id: undefined,
					} )
				);
			} );

			it( 'should preserve ID when only query string is added', () => {
				const setAttributes = jest.fn();
				const blockAttributes = {
					id: 123,
					type: 'page',
					kind: 'post-type',
					url: 'https://example.com/page',
				};

				const updatedValue = {
					url: 'https://example.com/page?utm_source=test',
				};

				updateAttributes(
					updatedValue,
					setAttributes,
					blockAttributes
				);

				expect( setAttributes ).toHaveBeenCalledWith(
					expect.objectContaining( {
						url: 'https://example.com/page?utm_source=test',
					} )
				);
				expect( setAttributes ).not.toHaveBeenCalledWith(
					expect.objectContaining( {
						id: undefined,
					} )
				);
			} );

			it( 'should preserve ID when only hash fragment is added', () => {
				const setAttributes = jest.fn();
				const blockAttributes = {
					id: 123,
					type: 'page',
					kind: 'post-type',
					url: 'https://example.com/page',
				};

				const updatedValue = {
					url: 'https://example.com/page#section',
				};

				updateAttributes(
					updatedValue,
					setAttributes,
					blockAttributes
				);

				expect( setAttributes ).toHaveBeenCalledWith(
					expect.objectContaining( {
						url: 'https://example.com/page#section',
					} )
				);
				expect( setAttributes ).not.toHaveBeenCalledWith(
					expect.objectContaining( {
						id: undefined,
					} )
				);
			} );

			it( 'should preserve ID when both query string and hash are added', () => {
				const setAttributes = jest.fn();
				const blockAttributes = {
					id: 123,
					type: 'page',
					kind: 'post-type',
					url: 'https://example.com/page',
				};

				const updatedValue = {
					url: 'https://example.com/page?param=value#section',
				};

				updateAttributes(
					updatedValue,
					setAttributes,
					blockAttributes
				);

				expect( setAttributes ).toHaveBeenCalledWith(
					expect.objectContaining( {
						url: 'https://example.com/page?param=value#section',
					} )
				);
				expect( setAttributes ).not.toHaveBeenCalledWith(
					expect.objectContaining( {
						id: undefined,
					} )
				);
			} );

			it( 'should preserve ID when query string is modified', () => {
				const setAttributes = jest.fn();
				const blockAttributes = {
					id: 123,
					type: 'page',
					kind: 'post-type',
					url: 'https://example.com/page?old=value',
				};

				const updatedValue = {
					url: 'https://example.com/page?new=value',
				};

				updateAttributes(
					updatedValue,
					setAttributes,
					blockAttributes
				);

				expect( setAttributes ).toHaveBeenCalledWith(
					expect.objectContaining( {
						url: 'https://example.com/page?new=value',
					} )
				);
				expect( setAttributes ).not.toHaveBeenCalledWith(
					expect.objectContaining( {
						id: undefined,
					} )
				);
			} );

			it( 'should preserve ID when hash fragment is modified', () => {
				const setAttributes = jest.fn();
				const blockAttributes = {
					id: 123,
					type: 'page',
					kind: 'post-type',
					url: 'https://example.com/page#old-section',
				};

				const updatedValue = {
					url: 'https://example.com/page#new-section',
				};

				updateAttributes(
					updatedValue,
					setAttributes,
					blockAttributes
				);

				expect( setAttributes ).toHaveBeenCalledWith(
					expect.objectContaining( {
						url: 'https://example.com/page#new-section',
					} )
				);
				expect( setAttributes ).not.toHaveBeenCalledWith(
					expect.objectContaining( {
						id: undefined,
					} )
				);
			} );

			it( 'should preserve ID when protocol changes from http to https', () => {
				const setAttributes = jest.fn();
				const blockAttributes = {
					id: 123,
					type: 'page',
					kind: 'post-type',
					url: 'http://example.com/page',
				};

				const updatedValue = {
					url: 'https://example.com/page',
				};

				updateAttributes(
					updatedValue,
					setAttributes,
					blockAttributes
				);

				expect( setAttributes ).toHaveBeenCalledWith(
					expect.objectContaining( {
						url: 'https://example.com/page',
					} )
				);
				expect( setAttributes ).not.toHaveBeenCalledWith(
					expect.objectContaining( {
						id: undefined,
					} )
				);
			} );

			it( 'should preserve ID when protocol changes from https to http', () => {
				const setAttributes = jest.fn();
				const blockAttributes = {
					id: 123,
					type: 'page',
					kind: 'post-type',
					url: 'https://example.com/page',
				};

				const updatedValue = {
					url: 'http://example.com/page',
				};

				updateAttributes(
					updatedValue,
					setAttributes,
					blockAttributes
				);

				expect( setAttributes ).toHaveBeenCalledWith(
					expect.objectContaining( {
						url: 'http://example.com/page',
					} )
				);
				expect( setAttributes ).not.toHaveBeenCalledWith(
					expect.objectContaining( {
						id: undefined,
					} )
				);
			} );

			it( 'should preserve ID when query string is removed', () => {
				const setAttributes = jest.fn();
				const blockAttributes = {
					id: 123,
					type: 'page',
					kind: 'post-type',
					url: 'https://example.com/page?utm_source=test',
				};

				const updatedValue = {
					url: 'https://example.com/page',
				};

				updateAttributes(
					updatedValue,
					setAttributes,
					blockAttributes
				);

				expect( setAttributes ).toHaveBeenCalledWith(
					expect.objectContaining( {
						url: 'https://example.com/page',
					} )
				);
				expect( setAttributes ).not.toHaveBeenCalledWith(
					expect.objectContaining( {
						id: undefined,
					} )
				);
			} );

			it( 'should preserve ID when hash fragment is removed', () => {
				const setAttributes = jest.fn();
				const blockAttributes = {
					id: 123,
					type: 'page',
					kind: 'post-type',
					url: 'https://example.com/page#section',
				};

				const updatedValue = {
					url: 'https://example.com/page',
				};

				updateAttributes(
					updatedValue,
					setAttributes,
					blockAttributes
				);

				expect( setAttributes ).toHaveBeenCalledWith(
					expect.objectContaining( {
						url: 'https://example.com/page',
					} )
				);
				expect( setAttributes ).not.toHaveBeenCalledWith(
					expect.objectContaining( {
						id: undefined,
					} )
				);
			} );

			it( 'should preserve ID when both query string and hash are removed', () => {
				const setAttributes = jest.fn();
				const blockAttributes = {
					id: 123,
					type: 'page',
					kind: 'post-type',
					url: 'https://example.com/page?param=value#section',
				};

				const updatedValue = {
					url: 'https://example.com/page',
				};

				updateAttributes(
					updatedValue,
					setAttributes,
					blockAttributes
				);

				expect( setAttributes ).toHaveBeenCalledWith(
					expect.objectContaining( {
						url: 'https://example.com/page',
					} )
				);
				expect( setAttributes ).not.toHaveBeenCalledWith(
					expect.objectContaining( {
						id: undefined,
					} )
				);
			} );

			it( 'should preserve ID when adding query string to URL with hash fragment', () => {
				const setAttributes = jest.fn();
				const blockAttributes = {
					id: 123,
					type: 'page',
					kind: 'post-type',
					url: 'http://localhost:8888/daves-page-2/#somehash',
				};

				const updatedValue = {
					url: 'http://localhost:8888/daves-page-2?somequery#somehash',
				};

				updateAttributes(
					updatedValue,
					setAttributes,
					blockAttributes
				);

				expect( setAttributes ).toHaveBeenCalledWith(
					expect.objectContaining( {
						url: 'http://localhost:8888/daves-page-2?somequery#somehash',
					} )
				);
				expect( setAttributes ).not.toHaveBeenCalledWith(
					expect.objectContaining( {
						id: undefined,
					} )
				);
			} );

			it( 'should preserve ID when query string is partially removed', () => {
				const setAttributes = jest.fn();
				const blockAttributes = {
					id: 123,
					type: 'page',
					kind: 'post-type',
					url: 'https://example.com/page?param1=value1&param2=value2',
				};

				const updatedValue = {
					url: 'https://example.com/page?param1=value1',
				};

				updateAttributes(
					updatedValue,
					setAttributes,
					blockAttributes
				);

				expect( setAttributes ).toHaveBeenCalledWith(
					expect.objectContaining( {
						url: 'https://example.com/page?param1=value1',
					} )
				);
				expect( setAttributes ).not.toHaveBeenCalledWith(
					expect.objectContaining( {
						id: undefined,
					} )
				);
			} );
		} );

		it( 'should remove ID when URL is changed without new ID', () => {
			const setAttributes = jest.fn();
			const blockAttributes = {
				id: 123,
				type: 'page',
				kind: 'post-type',
				url: 'https://example.com/original-page',
			};

			const updatedValue = {
				url: 'https://example.com/custom-url',
			};

			updateAttributes( updatedValue, setAttributes, blockAttributes );

			expect( setAttributes ).toHaveBeenCalledWith(
				expect.objectContaining( {
					id: undefined,
					kind: 'custom',
					type: 'custom',
					url: 'https://example.com/custom-url',
				} )
			);
		} );

		it( 'should preserve ID when new ID is provided with URL', () => {
			const setAttributes = jest.fn();
			const blockAttributes = {
				id: 123,
				type: 'page',
				kind: 'post-type',
				url: 'https://example.com/original-page',
			};

			const updatedValue = {
				url: 'https://example.com/new-page',
				id: 456,
			};

			updateAttributes( updatedValue, setAttributes, blockAttributes );

			expect( setAttributes ).toHaveBeenCalledWith(
				expect.objectContaining( {
					id: 456,
					url: 'https://example.com/new-page',
				} )
			);
		} );

		it( 'should not remove ID when only label is changed', () => {
			const setAttributes = jest.fn();
			const blockAttributes = {
				id: 123,
				type: 'page',
				kind: 'post-type',
				url: 'https://example.com/page',
			};

			const updatedValue = {
				label: 'New Label',
			};

			updateAttributes( updatedValue, setAttributes, blockAttributes );

			// When only label is changed, ID should not be included in the attributes
			// because it's not being modified
			expect( setAttributes ).toHaveBeenCalledWith( {
				label: 'New Label',
				kind: 'post-type',
				type: 'page',
			} );
		} );

		it( 'should not remove ID when only opensInNewTab is changed', () => {
			const setAttributes = jest.fn();
			const blockAttributes = {
				id: 123,
				type: 'page',
				kind: 'post-type',
				url: 'https://example.com/page',
			};

			const updatedValue = {
				opensInNewTab: true,
			};

			updateAttributes( updatedValue, setAttributes, blockAttributes );

			// When only opensInNewTab is changed, ID should not be included in the attributes
			// because it's not being modified
			expect( setAttributes ).toHaveBeenCalledWith( {
				opensInNewTab: true,
				kind: 'post-type',
				type: 'page',
			} );
		} );

		it( 'should handle case where block has no existing ID', () => {
			const setAttributes = jest.fn();
			const blockAttributes = {
				type: 'page',
				kind: 'post-type',
				url: 'https://example.com/page',
			};

			const updatedValue = {
				url: 'https://example.com/new-url',
			};

			updateAttributes( updatedValue, setAttributes, blockAttributes );

			expect( setAttributes ).toHaveBeenCalledWith(
				expect.objectContaining( {
					url: 'https://example.com/new-url',
				} )
			);
			// Should not set id to undefined if it wasn't set before
			expect( setAttributes ).not.toHaveBeenCalledWith(
				expect.objectContaining( {
					id: undefined,
				} )
			);
		} );

		it( 'should handle non-integer ID values', () => {
			const setAttributes = jest.fn();
			const blockAttributes = {
				id: 'not-an-integer',
				type: 'page',
				kind: 'post-type',
				url: 'https://example.com/page',
			};

			const updatedValue = {
				url: 'https://example.com/new-url',
			};

			updateAttributes( updatedValue, setAttributes, blockAttributes );

			// Should not set a new ID since the provided ID is not an integer
			expect( setAttributes ).toHaveBeenCalledWith(
				expect.objectContaining( {
					url: 'https://example.com/new-url',
				} )
			);
			expect( setAttributes ).not.toHaveBeenCalledWith(
				expect.objectContaining( {
					id: 'not-an-integer',
				} )
			);
		} );
	} );

	describe( 'Return value metadata', () => {
		describe( 'isEntityLink', () => {
			it( 'should return true for entity links with id and non-custom kind', () => {
				const setAttributes = jest.fn();
				const linkSuggestion = {
					id: 123,
					kind: 'post-type',
					type: 'page',
					url: 'https://example.com/page',
					title: 'Test Page',
				};

				const result = updateAttributes(
					linkSuggestion,
					setAttributes
				);

				expect( result ).toEqual( {
					isEntityLink: true,
					attributes: expect.any( Object ),
				} );
			} );

			it( 'should return false for custom links even with id', () => {
				const setAttributes = jest.fn();
				const linkSuggestion = {
					id: 123,
					kind: 'custom',
					type: 'custom',
					url: 'https://example.com/custom',
					title: 'Custom Link',
				};

				const result = updateAttributes(
					linkSuggestion,
					setAttributes
				);

				expect( result ).toEqual( {
					isEntityLink: false,
					attributes: expect.any( Object ),
				} );
			} );

			it( 'should return false for links without id', () => {
				const setAttributes = jest.fn();
				const linkSuggestion = {
					url: 'https://example.com',
					title: 'Example',
				};

				const result = updateAttributes(
					linkSuggestion,
					setAttributes
				);

				expect( result ).toEqual( {
					isEntityLink: false,
					attributes: expect.any( Object ),
				} );
			} );

			it( 'should return false when entity link is severed', () => {
				const setAttributes = jest.fn();
				const blockAttributes = {
					id: 123,
					type: 'page',
					kind: 'post-type',
					url: 'https://example.com/original-page',
				};

				const updatedValue = {
					url: 'https://example.com/different-page',
				};

				const result = updateAttributes(
					updatedValue,
					setAttributes,
					blockAttributes
				);

				// Should return false because the link was severed and converted to custom
				expect( result ).toEqual( {
					isEntityLink: false,
					attributes: expect.any( Object ),
				} );
			} );

			it( 'should return true when entity link is preserved through query string change', () => {
				const setAttributes = jest.fn();
				const blockAttributes = {
					id: 123,
					type: 'page',
					kind: 'post-type',
					url: 'https://example.com/page',
				};

				const updatedValue = {
					url: 'https://example.com/page?foo=bar',
				};

				const result = updateAttributes(
					updatedValue,
					setAttributes,
					blockAttributes
				);

				// Should return true because entity link is preserved
				expect( result ).toEqual( {
					isEntityLink: true,
					attributes: expect.any( Object ),
				} );
			} );

			it( 'should return false for mailto links', () => {
				const setAttributes = jest.fn();
				const linkSuggestion = {
					id: 'mailto:test@example.com',
					type: 'mailto',
					url: 'mailto:test@example.com',
					title: 'mailto:test@example.com',
				};

				const result = updateAttributes(
					linkSuggestion,
					setAttributes
				);

				// mailto links have kind: 'custom', so isEntityLink should be false
				expect( result ).toEqual( {
					isEntityLink: false,
					attributes: expect.any( Object ),
				} );
			} );

			it( 'should return false for tel links', () => {
				const setAttributes = jest.fn();
				const linkSuggestion = {
					id: 'tel:5555555',
					type: 'tel',
					url: 'tel:5555555',
					title: 'tel:5555555',
				};

				const result = updateAttributes(
					linkSuggestion,
					setAttributes
				);

				// tel links have kind: 'custom', so isEntityLink should be false
				expect( result ).toEqual( {
					isEntityLink: false,
					attributes: expect.any( Object ),
				} );
			} );

			it( 'should return true for taxonomy links', () => {
				const setAttributes = jest.fn();
				const linkSuggestion = {
					id: 5,
					kind: 'taxonomy',
					type: 'category',
					url: 'https://example.com/category/news',
					title: 'News',
				};

				const result = updateAttributes(
					linkSuggestion,
					setAttributes
				);

				expect( result ).toEqual( {
					isEntityLink: true,
					attributes: expect.any( Object ),
				} );
			} );
		} );
	} );
} );
