/**
 * Internal dependencies
 */
import transformStyles from '../transform-styles';

describe( 'transformStyles', () => {
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
