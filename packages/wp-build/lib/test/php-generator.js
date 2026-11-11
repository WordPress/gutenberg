import { readdirSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';
import {
	getTextDomainArgument,
	renderTemplateToString as generateTemplate,
} from '../php-generator.mjs';

const TEMPLATES_DIR = path.join(
	path.dirname( fileURLToPath( import.meta.url ) ),
	'..',
	'..',
	'templates'
);

const PAGE_REPLACEMENTS = {
	'{{PAGE_SLUG}}': 'example',
	'{{PAGE_SLUG_UNDERSCORE}}': 'example',
	'{{PREFIX}}': 'wp',
	'{{CAPABILITY}}': 'edit_theme_options',
	'{{TEXT_DOMAIN_ARG}}': '',
};

const PAGE_TEMPLATES = [ 'page.php.template', 'page-wp-admin.php.template' ];

describe( 'PHP templates', () => {
	// A fragment is inserted into another generated file, which has the check.
	const fileTemplates = readdirSync( TEMPLATES_DIR ).filter(
		( name ) =>
			name.endsWith( '.php.template' ) &&
			readFileSync( path.join( TEMPLATES_DIR, name ), 'utf8' ).startsWith(
				'<?php'
			)
	);

	it.each( fileTemplates )(
		'%s exits right after its file header when accessed directly',
		async ( templateName ) => {
			const generated = await generateTemplate( templateName, {} );
			const endOfFileHeader = generated.indexOf( ' */\n' ) + 4;
			expect( generated.slice( endOfFileHeader ) ).toMatch(
				/^\nif \( ! defined\( 'ABSPATH' \) \) \{\n\texit;\n\}\n/
			);
		}
	);
} );

describe.each( PAGE_TEMPLATES )( '%s template', ( templateName ) => {
	it( 'adds its styles and scripts through the WordPress APIs rather than inline tags', async () => {
		const generatedPage = await generateTemplate(
			templateName,
			PAGE_REPLACEMENTS
		);

		expect( generatedPage ).not.toMatch( /<style\b/ );
		expect( generatedPage ).not.toMatch( /<script\b/ );
	} );

	it( 'passes the configured text domain to the gettext calls', async () => {
		const generatedPage = await generateTemplate( templateName, {
			...PAGE_REPLACEMENTS,
			'{{TEXT_DOMAIN_ARG}}': getTextDomainArgument( 'my-plugin' ),
		} );

		const gettextCalls = generatedPage.match( /\b\w*__\( '.*?' .*?\)/g );
		expect( gettextCalls ).not.toHaveLength( 0 );
		for ( const call of gettextCalls ) {
			expect( call ).toMatch( /, 'my-plugin' \)$/ );
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
		const generatedPage = await generateTemplate(
			'page.php.template',
			PAGE_REPLACEMENTS
		);

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

describe( 'getTextDomainArgument', () => {
	it( 'returns no argument when no text domain is configured', () => {
		expect( getTextDomainArgument( undefined ) ).toBe( '' );
	} );

	it( 'returns the configured text domain as an argument', () => {
		expect( getTextDomainArgument( 'my-plugin' ) ).toBe( ", 'my-plugin'" );
	} );

	it.each( [ '', "my'plugin", 'my plugin', 42 ] )(
		'rejects the text domain %j',
		( textDomain ) => {
			expect( () => getTextDomainArgument( textDomain ) ).toThrow(
				'Invalid wpPlugin.textDomain'
			);
		}
	);
} );
