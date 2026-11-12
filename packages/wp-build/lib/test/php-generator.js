import { describe, expect, it } from 'vitest';
import {
	renderTemplateToString as generateTemplate,
	toPhpAssociativeArrayLiteral,
	toPhpListLiteral,
} from '../php-generator.mjs';

describe( 'page-wp-admin.php template', () => {
	it( 'retains the Core Boot compatibility class on the mount element', async () => {
		const generatedPage = await generateTemplate(
			'page-wp-admin.php.template',
			{
				'{{PAGE_SLUG}}': 'example',
			}
		);

		expect( generatedPage ).toContain(
			'<div id="example-wp-admin-app" class="boot-layout-container"></div>'
		);
	} );
} );

describe( 'page.php template', () => {
	it( 'guards the admin_init interceptor with authentication and the configured capability', async () => {
		const generatedPage = await generateTemplate( 'page.php.template', {
			'{{PAGE_SLUG}}': 'example',
			'{{PAGE_SLUG_UNDERSCORE}}': 'example',
			'{{PREFIX}}': 'wp',
			'{{CAPABILITY}}': 'edit_theme_options',
		} );

		const interceptor = generatedPage.slice(
			generatedPage.indexOf( 'function wp_example_intercept_render()' )
		);

		expect( interceptor ).toContain( 'is_user_logged_in()' );
		expect( interceptor ).toContain(
			"current_user_can( 'edit_theme_options' )"
		);
		expect( interceptor.indexOf( 'current_user_can' ) ).toBeLessThan(
			interceptor.indexOf( 'wp_example_render_page()' )
		);
	} );
} );

describe( 'toPhpListLiteral', () => {
	it( 'adds spaces inside a non-empty array', () => {
		expect( toPhpListLiteral( [ "'wp-components'", "'wp-editor'" ] ) ).toBe(
			"array( 'wp-components', 'wp-editor' )"
		);
	} );

	it( 'formats an empty array without inner spaces', () => {
		expect( toPhpListLiteral( [] ) ).toBe( 'array()' );
	} );
} );

describe( 'toPhpAssociativeArrayLiteral', () => {
	it( 'aligns the arrow operators to the longest key', () => {
		expect(
			toPhpAssociativeArrayLiteral(
				{
					handle: "'wp-editor'",
					path: "'editor/style'",
					dependencies: "array( 'wp-components' )",
				},
				'\t'
			)
		).toBe(
			[
				'\tarray(',
				"\t\t'handle'       => 'wp-editor',",
				"\t\t'path'         => 'editor/style',",
				"\t\t'dependencies' => array( 'wp-components' ),",
				'\t)',
			].join( '\n' )
		);
	} );

	it( 'omits undefined fields and aligns only the remaining keys', () => {
		expect(
			toPhpAssociativeArrayLiteral( {
				id: "'@wordpress/a11y'",
				asset: "'a11y/index.min.asset.php'",
				min_only: undefined,
			} )
		).toBe(
			[
				'array(',
				"\t'id'    => '@wordpress/a11y',",
				"\t'asset' => 'a11y/index.min.asset.php',",
				')',
			].join( '\n' )
		);
	} );
} );
