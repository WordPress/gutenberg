/**
 * WordPress dependencies
 */
import {
	getBlockTypes,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { getValidTextAlignments, addAssignedTextAlign } from '../text-align';

const noop = () => {};

describe( 'textAlign', () => {
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

	describe( 'getValidTextAlignments()', () => {
		it( 'should return an empty array if block does not define align support', () => {
			expect( getValidTextAlignments() ).toEqual( [] );
		} );

		it( 'should return all custom text aligns set', () => {
			expect( getValidTextAlignments( [ 'left', 'right' ] ) ).toEqual( [
				'left',
				'right',
			] );
		} );

		it( 'should return all text aligns sorted when provided in the random order', () => {
			expect(
				getValidTextAlignments( [ 'right', 'center', 'left' ] )
			).toEqual( [ 'left', 'center', 'right' ] );
		} );

		it( 'should return all text aligns if block defines text align support as true', () => {
			expect( getValidTextAlignments( true ) ).toEqual( [
				'left',
				'center',
				'right',
			] );
		} );

		it( 'should remove incorrect text aligns', () => {
			expect(
				getValidTextAlignments( [ 'left', 'right', 'justify' ] )
			).toEqual( [ 'left', 'right' ] );
		} );
	} );

	describe( 'addAssignedTextAlign', () => {
		it( 'should do nothing if block does not support text align', () => {
			registerBlockType( 'core/foo', blockSettings );

			const props = addAssignedTextAlign(
				{
					className: 'foo',
				},
				'core/foo',
				{
					typography: {
						textAlign: 'center',
					},
				}
			);

			expect( props ).toEqual( {
				className: 'foo',
			} );
		} );

		it( 'should do add text align classname if block supports text align', () => {
			registerBlockType( 'core/foo', {
				...blockSettings,
				supports: {
					typography: {
						textAlign: true,
					},
				},
			} );

			const props = addAssignedTextAlign(
				{
					className: 'foo',
				},
				'core/foo',
				{
					style: {
						typography: {
							textAlign: 'center',
						},
					},
				}
			);

			expect( props ).toEqual( {
				className: 'has-text-align-center foo',
			} );
		} );
	} );
} );
