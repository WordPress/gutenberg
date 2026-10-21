import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	createBlock,
	getBlockTypes,
	registerBlockType,
	setGroupingBlockName,
	unregisterBlockType,
} from '@wordpress/blocks';
import { dispatch, select } from '@wordpress/data';
import { store } from '../../store';
import { canGroupBlocks, groupBlocks } from '../group-blocks';

describe( 'groupBlocks', () => {
	afterEach( () => {
		dispatch( store ).resetBlocks( [] );
		setGroupingBlockName( 'core/group' );
		getBlockTypes().forEach( ( { name } ) => unregisterBlockType( name ) );
	} );

	it( 'respects the wildcard match before converting', () => {
		const isMatch = vi.fn( () => false );
		const convert = vi.fn( () => createBlock( 'test/group' ) );
		registerBlockType( 'test/group', {
			apiVersion: 3,
			title: 'Group',
			category: 'design',
			attributes: {},
			save: () => null,
			transforms: {
				from: [
					{
						type: 'block',
						blocks: [ '*' ],
						isMultiBlock: true,
						isMatch,
						__experimentalConvert: convert,
					},
				],
			},
		} );
		registerBlockType( 'test/child', {
			apiVersion: 3,
			title: 'Child',
			category: 'text',
			attributes: {},
			save: () => null,
		} );

		const blocks = [ createBlock( 'test/child' ) ];
		expect( canGroupBlocks( blocks, 'test/group' ) ).toBe( false );
		expect( groupBlocks( blocks, 'test/group' ) ).toBeNull();
		expect( isMatch ).toHaveBeenCalledWith(
			blocks.map( ( { attributes } ) => attributes ),
			blocks
		);
		expect( convert ).not.toHaveBeenCalled();
	} );

	it( 'uses a matching wildcard instead of the source semantic transform', () => {
		const semanticTransform = vi.fn( () => createBlock( 'test/group' ) );
		registerBlockType( 'test/group', {
			apiVersion: 3,
			title: 'Group',
			category: 'design',
			attributes: {},
			save: () => null,
			transforms: {
				from: [
					{
						type: 'block',
						blocks: [ '*' ],
						isMultiBlock: true,
						isMatch: () => true,
						__experimentalConvert: ( blocks ) =>
							createBlock(
								'test/group',
								{},
								Array.isArray( blocks ) ? blocks : [ blocks ]
							),
					},
				],
			},
		} );
		registerBlockType( 'test/child', {
			apiVersion: 3,
			title: 'Child',
			category: 'text',
			attributes: {},
			save: () => null,
			transforms: {
				to: [
					{
						type: 'block',
						blocks: [ 'test/group' ],
						transform: semanticTransform,
					},
				],
			},
		} );
		const block = createBlock( 'test/child' );

		expect(
			groupBlocks( [ block ], 'test/group' )?.[ 0 ].innerBlocks
		).toEqual( [ block ] );
		expect( semanticTransform ).not.toHaveBeenCalled();
	} );

	it( 'preserves regular conversion for a grouping block without a wildcard', () => {
		registerBlockType( 'test/group', {
			apiVersion: 3,
			title: 'Group',
			category: 'design',
			attributes: {},
			save: () => null,
			transforms: {
				from: [
					{
						type: 'block',
						blocks: [ 'test/child' ],
						transform: () => createBlock( 'test/group' ),
					},
				],
			},
		} );
		registerBlockType( 'test/child', {
			apiVersion: 3,
			title: 'Child',
			category: 'text',
			attributes: {},
			save: () => null,
		} );

		expect(
			groupBlocks( [ createBlock( 'test/child' ) ], 'test/group' )
		).toMatchObject( [ { name: 'test/group' } ] );
	} );

	it( 'does not offer grouping when the structural wildcard rejects the selection', () => {
		const isMatch = vi.fn( () => false );
		registerBlockType( 'test/group', {
			apiVersion: 3,
			title: 'Group',
			category: 'design',
			attributes: {},
			save: () => null,
			transforms: {
				from: [
					{
						type: 'block',
						blocks: [ '*' ],
						isMultiBlock: true,
						isMatch,
						__experimentalConvert: () =>
							createBlock( 'test/group' ),
					},
				],
			},
		} );
		registerBlockType( 'test/child', {
			apiVersion: 3,
			title: 'Child',
			category: 'text',
			attributes: {},
			save: () => null,
		} );
		setGroupingBlockName( 'test/group' );
		const block = createBlock( 'test/child' );
		dispatch( store ).updateSettings( { allowedBlockTypes: true } );
		dispatch( store ).resetBlocks( [ block ] );

		expect( select( store ).canInsertBlockType( 'test/group' ) ).toBe(
			true
		);
		expect( select( store ).canRemoveBlocks( [ block.clientId ] ) ).toBe(
			true
		);
		expect( select( store ).isGroupable( [ block.clientId ] ) ).toBe(
			false
		);
		isMatch.mockReturnValue( true );
		expect( select( store ).isGroupable( [ block.clientId ] ) ).toBe(
			true
		);
	} );
} );
