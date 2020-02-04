/**
 * Internal dependencies
 */

import { htmlToBlocks } from '../paste-handler';
import * as factory from '../../factory';
import * as parser from '../../parser';

let rawTransforms;

describe( 'htmlToBlocks', () => {
	beforeEach( () => {
		factory.createBlock = jest.fn( () => ( { name: 'core/html-block' } ) );
		parser.getBlockAttributes = jest.fn( () => ( {} ) );
		const iframeRegex = /<iframe>Custom Embed Block<\/iframe>/gi;
		rawTransforms = [
			{
				type: 'raw',
				isMatch: ( node ) =>
					node.nodeName === 'FIGURE' &&
					iframeRegex.test( node.innerHTML ),
				blockName: 'custom/block',
				transform: () => ( { name: 'custom/embed-block' } ),
			},
			{
				type: 'raw',
				priority: 15,
				blockName: 'core/html',
				isMatch: ( node ) =>
					node.nodeName === 'FIGURE' &&
					!! node.querySelector( 'iframe' ),
				transform: () => ( { name: 'core/html-transform' } ),
			},
		];
	} );

	it( 'should remove iframe if user cannot use unfiltered html and no transform found', () => {
		const result = htmlToBlocks( {
			html: '<div><iframe>Unknown Embed</iframe></div>',
			rawTransforms,
			canUserUseUnfilteredHTML: false,
		} );
		expect( result ).toEqual( [] );
	} );

	it( 'should remove iframe if user cannot use unfiltered html and no transform found and iframe is root node', () => {
		const result = htmlToBlocks( {
			html: '<iframe>Unknown Embed</iframe>',
			rawTransforms,
			canUserUseUnfilteredHTML: false,
		} );
		expect( result ).toEqual( [] );
	} );

	it( 'should transform iframe to core/html if user can use unfiltered html and no transform found', () => {
		const result = htmlToBlocks( {
			html: '<div><iframe>Unknown Embed</iframe></div>',
			rawTransforms,
			canUserUseUnfilteredHTML: true,
		} );
		expect( factory.createBlock ).toHaveBeenCalledWith( 'core/html', {} );
		expect( result ).toEqual( [ { name: 'core/html-block' } ] );
	} );

	it( 'should remove iframe if user cannot use unfiltered html and only core/html transform found', () => {
		const result = htmlToBlocks( {
			html: '<figure><iframe>Unknown Embed</iframe></figure>',
			rawTransforms,
			canUserUseUnfilteredHTML: false,
		} );
		expect( result ).toEqual( [] );
	} );

	it( 'should transform iframe if user cannot use unfiltered html but transform found', () => {
		const result = htmlToBlocks( {
			html: '<figure><iframe>Custom Embed Block</iframe></figure>',
			rawTransforms,
			canUserUseUnfilteredHTML: false,
		} );
		expect( result ).toEqual( [ { name: 'custom/embed-block' } ] );
	} );

	it( 'should transform iframe if user can use unfiltered html and transform found', () => {
		const result = htmlToBlocks( {
			html: '<figure><iframe>Custom Embed Block</iframe></figure>',
			rawTransforms,
			canUserUseUnfilteredHTML: true,
		} );
		expect( result ).toEqual( [ { name: 'custom/embed-block' } ] );
	} );

	it( 'should use core/html transform if user can use unfiltered html and no custom transform found', () => {
		const result = htmlToBlocks( {
			html: '<figure><iframe>Unknown Iframe</iframe></figure>',
			rawTransforms,
			canUserUseUnfilteredHTML: true,
		} );
		expect( factory.createBlock ).not.toHaveBeenCalled();
		expect( result ).toEqual( [ { name: 'core/html-transform' } ] );
	} );
} );
