/**
 * External dependencies
 */
import { shallow } from 'enzyme';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	registerBlockType,
	getBlockTypes,
	unregisterBlockType,
	createBlock,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { BlockDropZone } from '../';

describe( 'BlockDropZone', () => {
	beforeAll( () => {
		registerBlockType( 'core/foo', {
			save: noop,

			category: 'common',

			title: 'block title',

			attributes: {
				fileType: {
					type: 'string',
				},
			},

			transforms: {
				from: [
					{
						type: 'files',
						isMatch: ( files ) => files.some( ( file ) => file.isFooMatch ),
						transform( files ) {
							return Promise.resolve( files.map( ( file ) => (
								createBlock( 'core/foo', { fileType: file.type } )
							) ) );
						},
					},
				],
			},
		} );
	} );

	afterAll( () => {
		getBlockTypes().forEach( block => {
			unregisterBlockType( block.name );
		} );
	} );

	it( 'should render nothing if template locking in effect', () => {
		const wrapper = shallow( <BlockDropZone isLocked /> );

		expect( wrapper.type() ).toBe( null );
	} );

	it( 'should do nothing if no matched transform for dropped files', ( done ) => {
		const insertBlocks = jest.fn();
		const wrapper = shallow(
			<BlockDropZone insertBlocks={ insertBlocks } />
		);

		wrapper.prop( 'onFilesDrop' )( [
			{
				isBarMatch: true,
				type: 'application/x-fake',
			},
		] );

		process.nextTick( () => {
			expect( insertBlocks ).not.toHaveBeenCalled();
			done();
		} );
	} );

	it( 'should call insert callback with transformed files', ( done ) => {
		const insertBlocks = jest.fn();
		const wrapper = shallow(
			<BlockDropZone
				index={ 0 }
				insertBlocks={ insertBlocks } />
		);

		wrapper.prop( 'onFilesDrop' )( [
			{
				isFooMatch: true,
				type: 'application/x-fake',
			},
		], { y: 'bottom' } );

		process.nextTick( () => {
			expect( insertBlocks ).toHaveBeenCalled();
			const [ blocks, index ] = insertBlocks.mock.calls[ 0 ];
			expect( blocks ).toHaveLength( 1 );
			expect( blocks[ 0 ] ).toMatchObject( {
				name: 'core/foo',
				attributes: {
					fileType: 'application/x-fake',
				},
			} );
			expect( index ).toBe( 1 );
			done();
		} );
	} );

	it( 'should call insert callback with transformed files (top)', ( done ) => {
		const insertBlocks = jest.fn();
		const wrapper = shallow(
			<BlockDropZone
				index={ 0 }
				insertBlocks={ insertBlocks } />
		);

		wrapper.prop( 'onFilesDrop' )( [
			{
				isFooMatch: true,
				type: 'application/x-fake',
			},
		], { y: 'top' } );

		process.nextTick( () => {
			const [ , index ] = insertBlocks.mock.calls[ 0 ];
			expect( index ).toBe( 0 );
			done();
		} );
	} );

	it( 'should respect allowed block types (not allowed)', ( done ) => {
		const insertBlocks = jest.fn();
		const wrapper = shallow(
			<BlockDropZone
				index={ 0 }
				allowedBlockTypes={ [ 'core/bar' ] }
				insertBlocks={ insertBlocks } />
		);

		wrapper.prop( 'onFilesDrop' )( [
			{
				isFooMatch: true,
				type: 'application/x-fake',
			},
		], { y: 'top' } );

		process.nextTick( () => {
			expect( insertBlocks ).not.toHaveBeenCalled();
			done();
		} );
	} );

	it( 'should respect allowed block types (allowed)', ( done ) => {
		const insertBlocks = jest.fn();
		const wrapper = shallow(
			<BlockDropZone
				index={ 0 }
				allowedBlockTypes={ [ 'core/foo' ] }
				insertBlocks={ insertBlocks } />
		);

		wrapper.prop( 'onFilesDrop' )( [
			{
				isFooMatch: true,
				type: 'application/x-fake',
			},
		], { y: 'top' } );

		process.nextTick( () => {
			expect( insertBlocks ).toHaveBeenCalled();
			done();
		} );
	} );
} );
