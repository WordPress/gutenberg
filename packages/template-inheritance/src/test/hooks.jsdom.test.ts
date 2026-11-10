import { describe, expect, it } from 'vitest';
import type { WpTemplate } from '@wordpress/core-data';
import { getAvailableTemplates } from '../parent-template/hooks';

type TestTemplate = {
	slug: string;
	template?: string;
	has_template_slot?: boolean;
};

function templates( ...list: TestTemplate[] ): WpTemplate[] {
	return list as unknown as WpTemplate[];
}

function slugs( list: WpTemplate[] ): string[] {
	return list.map( ( { slug } ) => slug );
}

describe( 'getAvailableTemplates', () => {
	it( 'offers the templates with a slot, other than the template itself', () => {
		const all = templates(
			{ slug: 'layout', has_template_slot: true },
			{ slug: 'page-404', has_template_slot: true },
			{ slug: 'blank', has_template_slot: false }
		);

		expect(
			slugs( getAvailableTemplates( all, { slug: 'page-404' } ) )
		).toEqual( [ 'layout' ] );
	} );

	it( 'leaves out a template that is rendered inside another', () => {
		const all = templates(
			{ slug: 'base', has_template_slot: true },
			{ slug: 'layout', template: 'base', has_template_slot: true },
			{ slug: 'page-404', has_template_slot: true }
		);

		expect(
			slugs( getAvailableTemplates( all, { slug: 'page-404' } ) )
		).toEqual( [ 'base' ] );
	} );

	it( 'offers nothing to a template other templates are rendered inside', () => {
		const all = templates(
			{ slug: 'base', has_template_slot: true },
			{ slug: 'layout', has_template_slot: true },
			{ slug: 'page-404', template: 'layout', has_template_slot: true }
		);

		expect(
			slugs( getAvailableTemplates( all, { slug: 'layout' } ) )
		).toEqual( [] );
	} );

	it( 'keeps the template already named, whatever it holds', () => {
		const all = templates(
			{ slug: 'base', has_template_slot: true },
			{ slug: 'layout', template: 'base', has_template_slot: false },
			{ slug: 'page-404', template: 'layout', has_template_slot: true }
		);

		expect(
			slugs(
				getAvailableTemplates( all, {
					slug: 'page-404',
					template: 'layout',
				} )
			)
		).toEqual( [ 'base', 'layout' ] );
	} );

	it( 'offers nothing to a template with no slug', () => {
		const all = templates( { slug: 'layout', has_template_slot: true } );

		expect( getAvailableTemplates( all, {} ) ).toEqual( [] );
	} );
} );
