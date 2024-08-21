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
			const expected =
				':root :where(body) .my-namespace { color: pink; } :root :where(body) .my-namespace { color: orange; }';

			expect( output ).toEqual( [ expected ] );
		} );
	} );

	describe( 'root selectors', () => {
		it( 'should append prefix after `:root :where(body)` selectors', () => {
			const input = ':root :where(body) { color: red; }';
			const output = transformStyles(
				[
					{
						css: input,
					},
				],
				'.my-namespace'
			);
			const expected = ':root :where(body) .my-namespace { color: red; }';

			expect( output ).toEqual( [ expected ] );
		} );

		it( 'should append prefix after `:where(body)` selectors', () => {
			const input = ':where(body) { color: red; }';
			const output = transformStyles(
				[
					{
						css: input,
					},
				],
				'.my-namespace'
			);
			const expected = ':where(body) .my-namespace { color: red; }';

			expect( output ).toEqual( [ expected ] );
		} );

		it( 'should append prefix after body selectors', () => {
			const input = `body { color: red; }`;
			const output = transformStyles(
				[
					{
						css: input,
					},
				],
				'.my-namespace'
			);
			const expected = 'body .my-namespace { color: red; }';

			expect( output ).toEqual( [ expected ] );
		} );

		it( 'should append prefix after html selectors', () => {
			const input = `html { color: red; }`;
			const output = transformStyles(
				[
					{
						css: input,
					},
				],
				'.my-namespace'
			);
			const expected = 'html .my-namespace { color: red; }';

			expect( output ).toEqual( [ expected ] );
		} );

		it( 'should append prefix after :root selectors', () => {
			const input = ':root { color: red; }';
			const output = transformStyles(
				[
					{
						css: input,
					},
				],
				'.my-namespace'
			);
			const expected = ':root .my-namespace { color: red; }';

			expect( output ).toEqual( [ expected ] );
		} );

		it( 'should not double prefix a root selector', () => {
			const input = 'body .my-namespace h1  { color: goldenrod; }';
			const output = transformStyles(
				[
					{
						css: input,
					},
				],
				'.my-namespace'
			);

			expect( output ).toEqual( [ input ] );
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
			const expected = '.my-namespace h1 { color: red; }';

			expect( output ).toEqual( [ expected ] );
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
			const expected =
				'.my-namespace h1, .my-namespace h2 { color: red; }';

			expect( output ).toEqual( [ expected ] );
		} );

		it( 'should ignore ignored selectors', () => {
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
			const expected = '.my-namespace h1, body { color: red; }';

			expect( output ).toEqual( [ expected ] );
		} );

		it( `should not try to replace 'body' in the middle of a classname`, () => {
			const input = '.has-body-text { color: red; }';
			const output = transformStyles(
				[
					{
						css: input,
					},
				],
				'.my-namespace'
			);
			const expected = '.my-namespace .has-body-text { color: red; }';

			expect( output ).toEqual( [ expected ] );
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

			expect( output ).toEqual( [ input ] );
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
			const expected = `
			@container (width > 400px) {
				  .my-namespace h1 { color: red; }
			}`;

			expect( output ).toEqual( [ expected ] );
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

			expect( output ).toEqual( [ input ] );
		} );

		it( 'should not double wrap selectors', () => {
			const input = ' .my-namespace h1, .red { color: red; }';
			const output = transformStyles(
				[
					{
						css: input,
					},
				],
				'.my-namespace'
			);
			const expected = ` .my-namespace h1, .my-namespace .red { color: red; }`;

			expect( output ).toEqual( [ expected ] );
		} );

		it( 'should allow specification of ignoredSelectors per css input', () => {
			const input = '.ignored { color: red; }';
			const output = transformStyles(
				[
					{
						css: input,
						ignoredSelectors: [ '.ignored' ],
					},
					{
						css: input,
					},
				],
				'.not'
			);
			const expected1 = input;
			const expected2 = '.not .ignored { color: red; }';

			expect( output ).toEqual( [ expected1, expected2 ] );
		} );

		it( 'allows specification of ignoredSelectors globally via the transformOptions param', () => {
			const input = '.ignored { color: red; }';
			const output = transformStyles(
				[
					{
						css: input,
					},
					{
						css: input,
					},
				],
				'.not',
				{ ignoredSelectors: '.ignored' }
			);

			expect( output ).toEqual( [ input, input ] );
		} );

		it( 'should not try to wrap items within `:where` selectors', () => {
			const input =
				':where(.wp-element-button:active, .wp-block-button__link:active) { color: blue; }';
			const output = transformStyles(
				[
					{
						css: input,
					},
				],
				'.my-namespace'
			);
			const expected =
				'.my-namespace :where(.wp-element-button:active, .wp-block-button__link:active) { color: blue; }';

			expect( output ).toEqual( [ expected ] );
		} );

		it( 'should not try to prefix pseudo elements on `:where` selectors', () => {
			const input =
				':where(.wp-element-button, .wp-block-button__link)::before { color: blue; }';
			const output = transformStyles(
				[
					{
						css: input,
					},
				],
				'.my-namespace'
			);
			const expected =
				'.my-namespace :where(.wp-element-button, .wp-block-button__link)::before { color: blue; }';

			expect( output ).toEqual( [ expected ] );
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

		expect( output ).toEqual( [ input ] );
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
			const expected =
				'h1 { background: url(http://wp-site.local/themes/gut/css/images/test.png); }';

			expect( output ).toEqual( [ expected ] );
		} );

		it( 'should replace complex relative paths', () => {
			const input = `h1 { background: url(../images/test.png); }`;
			const output = transformStyles( [
				{
					css: input,
					baseURL: 'http://wp-site.local/themes/gut/css/',
				},
			] );
			const expected =
				'h1 { background: url(http://wp-site.local/themes/gut/images/test.png); }';

			expect( output ).toEqual( [ expected ] );
		} );

		it( 'should not replace absolute paths', () => {
			const input = `h1 { background: url(/images/test.png); }`;
			const output = transformStyles( [
				{
					css: input,
					baseURL: 'http://wp-site.local/themes/gut/css/',
				},
			] );
			expect( output ).toEqual( [ input ] );
		} );

		it( 'should not replace remote paths', () => {
			const input = `h1 { background: url(http://wp.org/images/test.png); }`;
			const output = transformStyles( [
				{
					css: input,
					baseURL: 'http://wp-site.local/themes/gut/css/',
				},
			] );

			expect( output ).toEqual( [ input ] );
		} );
	} );
} );
