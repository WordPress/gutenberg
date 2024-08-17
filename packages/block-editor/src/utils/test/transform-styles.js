/**
 * Internal dependencies
 */
import transformStyles from '../transform-styles';

describe( 'transformStyles', () => {
	describe( 'error handling', () => {
		beforeEach( () => {
			// Intentionally suppress the expected console errors and warnings to reduce
			// noise in the test output.
			jest.spyOn( console, 'warn' ).mockImplementation( jest.fn() );
		} );

		it( 'should not throw error in case of invalid css', () => {
			const run = () =>
				transformStyles(
					[
						{
							css: 'h1 { color: red;', // invalid CSS
						},
					],
					'.my-namespace'
				);

			expect( run ).not.toThrow();
			expect( console ).toHaveWarned();
		} );

		it( 'should warn invalid css in the console', () => {
			const run = () =>
				transformStyles(
					[
						{
							css: 'h1 { color: red; }', // valid CSS
						},
						{
							css: 'h1 { color: red;', // invalid CSS
						},
					],
					'.my-namespace'
				);

			const [ validCSS, invalidCSS ] = run();

			expect( validCSS ).toBe( '.my-namespace h1 { color: red; }' );
			expect( invalidCSS ).toBe( null );

			expect( console ).toHaveWarnedWith(
				'wp.blockEditor.transformStyles Failed to transform CSS.',
				'<css input>:1:1: Unclosed block\n> 1 | h1 { color: red;\n    | ^'
				//                                                        ^^^^ In PostCSS, a tab is equal four spaces
			);
		} );

		it( 'should handle multiple instances of `:root :where(body)`', () => {
			const input = `:root :where(body) { color: pink; } :root :where(body) { color: orange; }`;
			const output = transformStyles(
				[
					{
						css: input,
					},
				],
				'.my-namespace'
			);

			expect( output ).toMatchSnapshot();
		} );
	} );

	describe( 'selector wrap', () => {
		it( 'should wrap regular selectors', () => {
			const input = `h1 { color: red; }`;
			const output = transformStyles(
				[
					{
						css: input,
					},
				],
				'.my-namespace'
			);

			expect( output ).toMatchSnapshot();
		} );

		it( 'should wrap multiple selectors', () => {
			const input = `h1, h2 { color: red; }`;
			const output = transformStyles(
				[
					{
						css: input,
					},
				],
				'.my-namespace'
			);

			expect( output ).toMatchSnapshot();
		} );

		it( 'should ignore selectors', () => {
			const input = `h1, body { color: red; }`;
			const output = transformStyles(
				[
					{
						css: input,
						ignoredSelectors: [ 'body' ],
					},
				],
				'.my-namespace'
			);

			expect( output ).toMatchSnapshot();
		} );

		it( 'should replace root tags', () => {
			const input = `body, h1 { color: red; }`;
			const output = transformStyles(
				[
					{
						css: input,
					},
				],
				'.my-namespace'
			);

			expect( output ).toMatchSnapshot();
		} );

		it( `should not try to replace 'body' in the middle of a classname`, () => {
			const prefix = '.my-namespace';
			const input = `.has-body-text { color: red; }`;
			const output = transformStyles(
				[
					{
						css: input,
					},
				],
				prefix
			);

			expect( output ).toEqual( [ `${ prefix } ${ input }` ] );
		} );

		it( 'should ignore keyframes', () => {
			const input = `
			@keyframes edit-post__fade-in-animation {
				from {
					opacity: 0;
				}
			}`;
			const output = transformStyles(
				[
					{
						css: input,
					},
				],
				'.my-namespace'
			);

			expect( output ).toMatchSnapshot();
		} );

		it( 'should wrap selectors inside container queries', () => {
			const input = `
			@container (width > 400px) {
				  h1 { color: red; }
			}`;
			const output = transformStyles(
				[
					{
						css: input,
					},
				],
				'.my-namespace'
			);

			expect( output ).toMatchSnapshot();
		} );

		it( 'should ignore font-face selectors', () => {
			const input = `
			@font-face {
				font-family: myFirstFont;
				src: url(sansation_light.woff);
			}`;
			const output = transformStyles(
				[
					{
						css: input,
					},
				],
				'.my-namespace'
			);

			expect( output ).toMatchSnapshot();
		} );

		it( 'should replace :root selectors', () => {
			const input = `
			:root {
				--my-color: #ff0000;
			}`;
			const output = transformStyles(
				[
					{
						css: input,
					},
				],
				'.my-namespace'
			);

			expect( output ).toMatchSnapshot();
		} );

		it( 'should not double wrap selectors', () => {
			const input = ` .my-namespace h1, .red { color: red; }`;

			const output = transformStyles(
				[
					{
						css: input,
					},
				],
				'.my-namespace'
			);

			expect( output ).toMatchSnapshot();
		} );

		it( 'should not try to wrap items within `:where` selectors', () => {
			const input = `:where(.wp-element-button:active, .wp-block-button__link:active) { color: blue; }`;
			const prefix = '.my-namespace';
			const expected = [ `${ prefix } ${ input }` ];

			const output = transformStyles(
				[
					{
						css: input,
					},
				],
				prefix
			);

			expect( output ).toEqual( expected );
		} );

		it( 'should not try to prefix pseudo elements on `:where` selectors', () => {
			const input = `:where(.wp-element-button, .wp-block-button__link)::before { color: blue; }`;
			const prefix = '.my-namespace';
			const expected = [ `${ prefix } ${ input }` ];

			const output = transformStyles(
				[
					{
						css: input,
					},
				],
				prefix
			);

			expect( output ).toEqual( expected );
		} );
	} );

	it( 'should not break with data urls', () => {
		const input = `.wp-block-group {
			background-image: url("data:image/svg+xml,%3Csvg%3E.b%7Bclip-path:url(test);%7D%3C/svg%3E");
			color: red !important;
		  }`;

		const output = transformStyles( [
			{
				css: input,
				baseURL: 'http://wp-site.local/themes/gut/css/',
			},
		] );

		expect( output ).toMatchSnapshot();
	} );

	describe( 'URL rewrite', () => {
		it( 'should rewrite relative paths', () => {
			const input = `h1 { background: url(images/test.png); }`;
			const output = transformStyles( [
				{
					css: input,
					baseURL: 'http://wp-site.local/themes/gut/css/',
				},
			] );

			expect( output ).toMatchSnapshot();
		} );

		it( 'should replace complex relative paths', () => {
			const input = `h1 { background: url(../images/test.png); }`;
			const output = transformStyles( [
				{
					css: input,
					baseURL: 'http://wp-site.local/themes/gut/css/',
				},
			] );

			expect( output ).toMatchSnapshot();
		} );

		it( 'should not replace absolute paths', () => {
			const input = `h1 { background: url(/images/test.png); }`;
			const output = transformStyles( [
				{
					css: input,
					baseURL: 'http://wp-site.local/themes/gut/css/',
				},
			] );

			expect( output ).toMatchSnapshot();
		} );

		it( 'should not replace remote paths', () => {
			const input = `h1 { background: url(http://wp.org/images/test.png); }`;
			const output = transformStyles( [
				{
					css: input,
					baseURL: 'http://wp-site.local/themes/gut/css/',
				},
			] );

			expect( output ).toMatchSnapshot();
		} );
	} );
} );
