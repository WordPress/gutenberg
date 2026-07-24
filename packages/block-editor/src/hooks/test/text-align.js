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
import {
	getValidTextAlignments,
	addAssignedTextAlign,
	getTextAlignControlGroup,
} from '../text-align';

const noop = () => {};

describe( 'textAlign', () => {
	const blockSettings = {
		apiVersion: 3,
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

	describe( 'getTextAlignControlGroup()', () => {
		it( 'uses the regular block slot by default', () => {
			expect(
				getTextAlignControlGroup( false, {
					viewport: 'default',
					pseudo: 'default',
				} )
			).toBe( 'block' );
		} );

		it( 'uses the regular block slot when responsive editing has no viewport state', () => {
			expect(
				getTextAlignControlGroup( true, {
					viewport: 'default',
					pseudo: 'default',
				} )
			).toBe( 'block' );
		} );

		it( 'uses the style-state slot when responsive editing has a viewport state', () => {
			expect(
				getTextAlignControlGroup( true, {
					viewport: '@mobile',
					pseudo: 'default',
				} )
			).toBe( 'style-state' );
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
