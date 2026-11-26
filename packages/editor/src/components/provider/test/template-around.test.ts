import { describe, expect, it } from 'vitest';
import { getTemplateAround, isRenderedOnItsOwn } from '../template-around';

const page = { id: 1, type: 'page' };
const pageTemplate = { id: 'theme//page', type: 'wp_template' };
const template = { id: 'theme//page-404', type: 'wp_template' };
const layout = { id: 'theme//layout', type: 'wp_template' };
const templatePart = { id: 'theme//header', type: 'wp_template_part' };

describe( 'getTemplateAround', () => {
	it( 'renders the template of a page around it', () => {
		expect( getTemplateAround( page, pageTemplate ) ).toBe( pageTemplate );
	} );

	it( 'renders nothing around a post its caller names no template for', () => {
		expect( getTemplateAround( page, undefined ) ).toBeUndefined();
	} );

	// The extensible site editor names a template as its own template.
	it( 'renders nothing around a template named as its own template', () => {
		expect( getTemplateAround( template, template ) ).toBeUndefined();
	} );

	it( 'renders another template named for a template around it', () => {
		expect( getTemplateAround( template, layout ) ).toBe( layout );
	} );
} );

describe( 'isRenderedOnItsOwn', () => {
	it.each( [
		[ 'a template named as its own template', template, template ],
		[ 'a template with no template named', template, undefined ],
		[ 'a template part', templatePart, undefined ],
		[ 'a pattern', { id: 3, type: 'wp_block' }, undefined ],
		[ 'a navigation menu', { id: 4, type: 'wp_navigation' }, undefined ],
	] )( 'renders %s on its own', ( _, post, templateNamed ) => {
		expect( isRenderedOnItsOwn( post, templateNamed ) ).toBe( true );
	} );

	it( 'renders a template inside another template named for it', () => {
		expect( isRenderedOnItsOwn( template, layout ) ).toBe( false );
	} );

	it( 'waits for the template of a page that has not loaded yet', () => {
		expect( isRenderedOnItsOwn( page, undefined ) ).toBe( false );
	} );

	it( 'renders a page inside its template', () => {
		expect( isRenderedOnItsOwn( page, pageTemplate ) ).toBe( false );
	} );
} );
