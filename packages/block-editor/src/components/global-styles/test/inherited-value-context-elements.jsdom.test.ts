import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import { getBlockTypesForElement } from '../inherited-value-context';

describe( 'getBlockTypesForElement', () => {
	beforeAll( () => {
		registerBlockType( 'core/site-tagline', {
			apiVersion: 3,
			title: 'Site Tagline',
			category: 'theme',
			attributes: { level: { type: 'number', default: 0 } },
		} );
		registerBlockType( 'core/site-title', {
			apiVersion: 3,
			title: 'Site Title',
			category: 'theme',
			attributes: { level: { type: 'number', default: 1 } },
		} );
	} );

	afterAll( () => {
		unregisterBlockType( 'core/site-tagline' );
		unregisterBlockType( 'core/site-title' );
	} );

	it.each( [ 'heading', 'h2' ] )(
		'returns the heading family for %s',
		( element ) => {
			const blockTypes = getBlockTypesForElement( element );
			expect( blockTypes ).toContain( 'core/post-title' );
			expect( blockTypes ).not.toContain( 'core/paragraph' );
		}
	);

	it( 'leaves out heading blocks whose level defaults to 0', () => {
		const blockTypes = getBlockTypesForElement( 'heading' );
		expect( blockTypes ).not.toContain( 'core/site-tagline' );
		expect( blockTypes ).toContain( 'core/site-title' );
	} );

	it( 'returns only whole-link blocks for the link element', () => {
		const blockTypes = getBlockTypesForElement( 'link' );
		expect( blockTypes ).toContain( 'core/read-more' );
		expect( blockTypes ).not.toContain( 'core/post-author-name' );
		expect( blockTypes ).not.toContain( 'core/loginout' );
	} );

	it.each( [ 'caption', 'h7', 'constructor' ] )(
		'returns an empty array for %s',
		( element ) => {
			expect( getBlockTypesForElement( element ) ).toEqual( [] );
		}
	);
} );
