/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';
import {
	getBlockTypes,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { getValidAlignments, addAssignedAlign } from '../align';

const noop = () => {};

describe( 'align', () => {
	const blockSettings = {
		save: noop,
		category: 'text',
		title: 'block title',
		edit: ( { children } ) => <>{ children }</>,
	};

	afterEach( () => {
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	describe( 'addAttribute()', () => {
		const filterRegisterBlockType = applyFilters.bind(
			null,
			'blocks.registerBlockType'
		);

		it( 'should do nothing if the block settings does not define align support', () => {
			const settings = filterRegisterBlockType( blockSettings );

			expect( settings.attributes ).toBeUndefined();
		} );

		it( 'should assign a new align attribute', () => {
			const settings = filterRegisterBlockType( {
				...blockSettings,
				supports: {
					align: true,
				},
			} );

			expect( settings.attributes ).toHaveProperty( 'align' );
		} );
	} );

	describe( 'getValidAlignments()', () => {
		it( 'should return an empty array if block does not define align support', () => {
			expect( getValidAlignments() ).toEqual( [] );
		} );

		it( 'should return all custom aligns set', () => {
			expect( getValidAlignments( [ 'left', 'right' ] ) ).toEqual( [
				'left',
				'right',
			] );
		} );

		it( 'should return all aligns sorted when provided in the random order', () => {
			expect(
				getValidAlignments( [
					'full',
					'right',
					'center',
					'wide',
					'left',
				] )
			).toEqual( [ 'left', 'center', 'right', 'wide', 'full' ] );
		} );

		it( 'should return all aligns if block defines align support as true', () => {
			expect( getValidAlignments( true ) ).toEqual( [
				'left',
				'center',
				'right',
				'wide',
				'full',
			] );
		} );
		it( 'should return all aligns except wide if wide align explicitly false on the block', () => {
			expect( getValidAlignments( true, false, true ) ).toEqual( [
				'left',
				'center',
				'right',
			] );

			expect( getValidAlignments( true, false, false ) ).toEqual( [
				'left',
				'center',
				'right',
			] );
		} );

		it( 'should return all aligns except wide if wide align is not supported by the theme', () => {
			expect( getValidAlignments( true, true, false ) ).toEqual( [
				'left',
				'center',
				'right',
			] );

			expect( getValidAlignments( true, false, false ) ).toEqual( [
				'left',
				'center',
				'right',
			] );
		} );

		it( 'should not remove wide aligns if they are not supported by the block and were set using an array in supports align', () => {
			expect(
				getValidAlignments(
					[ 'left', 'right', 'wide', 'full' ],
					false,
					true
				)
			).toEqual( [ 'left', 'right', 'wide', 'full' ] );
		} );

		it( 'should remove wide aligns if they are not supported by the theme and were set using an array in supports align', () => {
			expect(
				getValidAlignments(
					[ 'left', 'right', 'wide', 'full' ],
					true,
					false
				)
			).toEqual( [ 'left', 'right' ] );

			expect(
				getValidAlignments(
					[ 'left', 'right', 'wide', 'full' ],
					false,
					false
				)
			).toEqual( [ 'left', 'right' ] );
		} );
	} );

	describe( 'addAssignedAlign', () => {
		it( 'should do nothing if block does not support align', () => {
			registerBlockType( 'core/foo', blockSettings );

			const props = addAssignedAlign(
				{
					className: 'foo',
				},
				'core/foo',
				{
					align: 'wide',
				}
			);

			expect( props ).toEqual( {
				className: 'foo',
			} );
		} );

		it( 'should do add align classname if block supports align', () => {
			registerBlockType( 'core/foo', {
				...blockSettings,
				supports: {
					align: true,
				},
			} );

			const props = addAssignedAlign(
				{
					className: 'foo',
				},
				'core/foo',
				{
					align: 'wide',
				}
			);

			expect( props ).toEqual( {
				className: 'alignwide foo',
			} );
		} );
	} );
} );
