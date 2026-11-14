import { describe, expect, it, vi } from 'vitest';
import {
	getStartingRenderingMode,
	getTemplateAround,
} from '../template-around';

const page = { id: 1, type: 'page' };
const pageTemplate = { id: 'theme//page', type: 'wp_template' };
const template = { id: 'theme//page-404', type: 'wp_template' };
const layout = { id: 'theme//layout', type: 'wp_template' };

describe( 'getTemplateAround', () => {
	it( 'renders the template of a page around it', () => {
		expect( getTemplateAround( page, pageTemplate ) ).toBe( pageTemplate );
	} );

	it( 'renders nothing around a post its host names no template for', () => {
		expect( getTemplateAround( page, undefined ) ).toBeUndefined();
	} );

	/*
	 * The extensible site editor has always named a template as its own
	 * template, with or without the templates inside templates experiment, and
	 * the site editor does for a template that names none. Nothing is rendered
	 * around it, so it is edited on its own as it always was.
	 */
	it( 'renders nothing around a template named as its own template', () => {
		expect( getTemplateAround( template, template ) ).toBeUndefined();
	} );

	it( 'renders the template a template is rendered inside around it', () => {
		expect( getTemplateAround( template, layout ) ).toBe( layout );
	} );
} );

describe( 'getStartingRenderingMode', () => {
	it( 'starts in the mode the host asks for', () => {
		expect(
			getStartingRenderingMode( {
				renderingMode: 'template-locked',
				standsForOwnTemplate: true,
				getPostTypeDefaultMode: () => 'post-only',
			} )
		).toBe( 'template-locked' );
	} );

	it( 'starts a template standing for itself on its own, whatever its post type names', () => {
		const getPostTypeDefaultMode = vi.fn( () => 'template-locked' );

		expect(
			getStartingRenderingMode( {
				standsForOwnTemplate: true,
				getPostTypeDefaultMode,
			} )
		).toBe( 'post-only' );
		expect( getPostTypeDefaultMode ).not.toHaveBeenCalled();
	} );

	it( 'starts anything else in the default mode of its post type', () => {
		expect(
			getStartingRenderingMode( {
				standsForOwnTemplate: false,
				getPostTypeDefaultMode: () => 'template-locked',
			} )
		).toBe( 'template-locked' );
	} );

	it( 'waits for the default mode of the post type to resolve', () => {
		expect(
			getStartingRenderingMode( {
				standsForOwnTemplate: false,
				getPostTypeDefaultMode: () => undefined,
			} )
		).toBeUndefined();
	} );
} );
