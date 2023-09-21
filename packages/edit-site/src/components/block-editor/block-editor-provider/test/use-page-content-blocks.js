/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';
/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import usePageContentBlocks from '../use-page-content-blocks';

jest.mock( '@wordpress/blocks', () => {
	return {
		__esModule: true,
		...jest.requireActual( '@wordpress/blocks' ),
		createBlock( name, attributes = {}, innerBlocks = [] ) {
			return {
				name,
				attributes,
				innerBlocks,
			};
		},
	};
} );

describe( 'usePageContentBlocks', () => {
	const blocksList = [
		createBlock( 'core/group', {}, [
			createBlock( 'core/post-title' ),
			createBlock( 'core/post-featured-image' ),
			createBlock( 'core/query', {}, [
				createBlock( 'core/post-title' ),
				createBlock( 'core/post-featured-image' ),
				createBlock( 'core/post-content' ),
			] ),
			createBlock( 'core/post-content' ),
		] ),
		createBlock( 'core/query' ),
		createBlock( 'core/paragraph' ),
		createBlock( 'core/post-content' ),
	];
	it( 'should return empty array if `isPageContentFocused` is `false`', () => {
		const { result } = renderHook( () =>
			usePageContentBlocks( {
				blocks: blocksList,
				isPageContentFocused: false,
			} )
		);
		expect( result.current ).toEqual( [] );
	} );
	it( 'should return empty array if `blocks` is undefined', () => {
		const { result } = renderHook( () =>
			usePageContentBlocks( {
				blocks: undefined,
				isPageContentFocused: true,
			} )
		);
		expect( result.current ).toEqual( [] );
	} );
	it( 'should return empty array if `blocks` is an empty array', () => {
		const { result } = renderHook( () =>
			usePageContentBlocks( {
				blocks: [],
				isPageContentFocused: true,
			} )
		);
		expect( result.current ).toEqual( [] );
	} );
	it( 'should return new block list', () => {
		const { result } = renderHook( () =>
			usePageContentBlocks( {
				blocks: blocksList,
				isPageContentFocused: true,
			} )
		);
		expect( result.current ).toEqual( [
			createBlock( 'core/post-title' ),
			createBlock( 'core/post-featured-image' ),
			createBlock( 'core/post-content' ),
			createBlock( 'core/post-content' ),
		] );
	} );
	it( 'should return new block list wrapped in a Group block', () => {
		const { result } = renderHook( () =>
			usePageContentBlocks( {
				blocks: blocksList,
				isPageContentFocused: true,
				wrapPageContent: true,
			} )
		);
		expect( result.current ).toEqual( [
			{
				name: 'core/group',
				attributes: {
					layout: { type: 'constrained' },
					style: {
						spacing: {
							margin: {
								top: '4em', // Mimics the post editor.
							},
						},
					},
				},
				innerBlocks: [
					createBlock( 'core/post-title' ),
					createBlock( 'core/post-featured-image' ),
					createBlock( 'core/post-content' ),
					createBlock( 'core/post-content' ),
				],
			},
		] );
	} );
} );
