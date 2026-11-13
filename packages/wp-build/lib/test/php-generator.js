import { mkdtemp, mkdir, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';
import {
	getPhpReplacements,
	renderTemplateToString as generateTemplate,
} from '../php-generator.mjs';

describe( 'getPhpReplacements', () => {
	it( 'falls back to a hash of the build when package.json has no version', async () => {
		const rootDir = await mkdtemp( path.join( tmpdir(), 'wp-build-php-' ) );
		await writeFile(
			path.join( rootDir, 'package.json' ),
			JSON.stringify( { name: 'example' } )
		);
		await mkdir( path.join( rootDir, 'build', 'styles' ), {
			recursive: true,
		} );
		await writeFile(
			path.join( rootDir, 'build', 'styles', 'style.css' ),
			'a{}'
		);

		try {
			const { '{{VERSION}}': version } = await getPhpReplacements(
				rootDir,
				''
			);
			expect( version ).toMatch( /^[0-9a-f]{20}$/ );

			await writeFile(
				path.join( rootDir, 'build', 'styles', 'style.css' ),
				'b{}'
			);
			const { '{{VERSION}}': changedVersion } = await getPhpReplacements(
				rootDir,
				''
			);
			expect( changedVersion ).not.toBe( version );
		} finally {
			await rm( rootDir, { recursive: true, force: true } );
		}
	} );

	it( 'falls back to a hash when there is no build directory yet', async () => {
		const rootDir = await mkdtemp( path.join( tmpdir(), 'wp-build-php-' ) );
		await writeFile(
			path.join( rootDir, 'package.json' ),
			JSON.stringify( { name: 'example' } )
		);

		try {
			const { '{{VERSION}}': version } = await getPhpReplacements(
				rootDir,
				''
			);
			expect( version ).toMatch( /^[0-9a-f]{20}$/ );
		} finally {
			await rm( rootDir, { recursive: true, force: true } );
		}
	} );
} );

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
