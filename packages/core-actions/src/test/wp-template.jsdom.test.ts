import { describe, expect, it } from 'vitest';
import wpTemplate from '../wp_template';
import type { Template } from '../shared/types';

describe( 'wp_template', () => {
	it( 'maps the id of each template action to its JavaScript parts', () => {
		expect( Object.keys( wpTemplate ) ).toEqual( [ 'duplicate-template' ] );
		for ( const parts of Object.values( wpTemplate ) ) {
			// The data of the action, such as its id and label, is
			// registered on the server.
			expect( parts ).not.toHaveProperty( 'id' );
			expect( 'RenderModal' in parts ).toBe( true );
		}
	} );

	it( 'duplicates the custom templates only', () => {
		const template: Template = {
			id: 'theme//wp-custom-template-landing-page',
			type: 'wp_template',
			status: 'publish',
			title: 'Landing page',
			content: '',
			is_custom: true,
			source: 'custom',
			origin: '',
			has_theme_file: false,
			author_text: '',
		};
		const { isEligible } = wpTemplate[ 'duplicate-template' ];

		expect( isEligible?.( template ) ).toBe( true );
		// There can only be one of each of the theme's templates, such as
		// `index` or `single`.
		expect( isEligible?.( { ...template, is_custom: false } ) ).toBe(
			false
		);
		// A custom template from the theme or from a plugin.
		expect( isEligible?.( { ...template, has_theme_file: true } ) ).toBe(
			false
		);
		expect( isEligible?.( { ...template, plugin: 'my-plugin' } ) ).toBe(
			false
		);
		expect( isEligible?.( { ...template, status: 'trash' } ) ).toBe(
			false
		);
	} );
} );
