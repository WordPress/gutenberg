/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react-native';

/**
 * WordPress dependencies
 */
import { getBlockTypes, unregisterBlockType } from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';

/**
 * Internal dependencies
 */
import { useEditorWrapperStyles } from '../use-editor-wrapper-styles';

jest.mock( '../use-editor-wrapper-styles.scss', () => ( {
	'use-editor-wrapper-styles': {
		width: '100%',
		maxWidth: 580,
		alignSelf: 'center',
	},
	'use-editor-wrapper-styles--reversed': {
		flexDirection: 'column-reverse',
		width: '100%',
		maxWidth: 580,
	},
} ) );

const defaultCanvasStyles = {
	width: '100%',
	maxWidth: 580,
	alignSelf: 'center',
};

describe( 'useEditorWrapperStyles', () => {
	beforeAll( () => {
		// Register all core blocks
		registerCoreBlocks();
	} );

	afterAll( () => {
		// Clean up registered blocks
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	it( 'should return the default wrapper styles when no props are set', () => {
		// Arrange
		jest.spyOn(
			require( 'react-native' ),
			'useWindowDimensions'
		).mockReturnValue( { width: 900, height: 600 } );

		// Act
		const { result } = renderHook( () => useEditorWrapperStyles() );

		// Assert
		expect( result.current[ 0 ] ).toEqual( [
			expect.objectContaining( defaultCanvasStyles ),
			{},
		] );
	} );

	it( 'should return the correct wrapper styles and margin for wide (medium) alignment', () => {
		// Arrange
		jest.spyOn(
			require( 'react-native' ),
			'useWindowDimensions'
		).mockReturnValue( { width: 900, height: 600 } );

		// Act
		const { result } = renderHook( () =>
			useEditorWrapperStyles( {
				align: 'wide',
				blockName: 'core/group',
				blockWidth: 800,
				marginHorizontal: 16,
			} )
		);

		// Assert
		expect( result.current[ 0 ] ).toEqual( [
			expect.objectContaining( defaultCanvasStyles ),
			expect.objectContaining( {
				maxWidth: 770,
			} ),
		] );
		expect( result.current[ 1 ] ).toEqual( 16 );
	} );

	it( 'should return the correct wrapper styles and margin for wide (landscape) alignment', () => {
		// Arrange
		jest.spyOn(
			require( 'react-native' ),
			'useWindowDimensions'
		).mockReturnValue( { width: 800, height: 600 } );

		// Act
		const { result } = renderHook( () =>
			useEditorWrapperStyles( {
				align: 'wide',
				blockName: 'core/group',
				blockWidth: 700,
				marginHorizontal: 16,
			} )
		);

		// Assert
		expect( result.current[ 0 ] ).toEqual( [
			expect.objectContaining( defaultCanvasStyles ),
			expect.objectContaining( {
				maxWidth: 662,
			} ),
		] );
		expect( result.current[ 1 ] ).toEqual( 16 );
	} );

	it( 'should return the correct wrapper styles and margin for wide alignment', () => {
		// Arrange
		jest.spyOn(
			require( 'react-native' ),
			'useWindowDimensions'
		).mockReturnValue( { width: 1194, height: 834 } );

		// Act
		const { result } = renderHook( () =>
			useEditorWrapperStyles( {
				align: 'wide',
				blockName: 'core/group',
				blockWidth: 800,
				marginHorizontal: 16,
			} )
		);

		// Assert
		expect( result.current[ 0 ] ).toEqual( [
			expect.objectContaining( defaultCanvasStyles ),
			expect.objectContaining( {
				maxWidth: 1054,
			} ),
		] );
		expect( result.current[ 1 ] ).toEqual( 16 );
	} );

	it( 'should return the correct wrapper styles and margin for full alignment', () => {
		// Arrange
		jest.spyOn(
			require( 'react-native' ),
			'useWindowDimensions'
		).mockReturnValue( { width: 800, height: 600 } );

		// Act
		const { result } = renderHook( () =>
			useEditorWrapperStyles( {
				align: 'full',
				blockName: 'core/cover',
				blockWidth: 700,
				marginHorizontal: 16,
			} )
		);

		// Assert
		expect( result.current[ 0 ] ).toEqual( [
			expect.objectContaining( defaultCanvasStyles ),
			expect.objectContaining( {
				maxWidth: '100%',
			} ),
		] );
		expect( result.current[ 1 ] ).toEqual( 0 );
	} );

	it( 'should return the correct wrapper styles and margin for left alignment', () => {
		// Arrange
		jest.spyOn(
			require( 'react-native' ),
			'useWindowDimensions'
		).mockReturnValue( { width: 800, height: 600 } );

		// Act
		const { result } = renderHook( () =>
			useEditorWrapperStyles( { align: 'left', marginHorizontal: 16 } )
		);

		// Assert
		expect( result.current[ 0 ] ).toEqual( [
			expect.objectContaining( defaultCanvasStyles ),
			{},
		] );
		expect( result.current[ 1 ] ).toEqual( 16 );
	} );

	it( 'should return the correct wrapper styles and margin for center alignment', () => {
		// Arrange
		jest.spyOn(
			require( 'react-native' ),
			'useWindowDimensions'
		).mockReturnValue( { width: 640, height: 960 } );

		// Act
		const { result } = renderHook( () =>
			useEditorWrapperStyles( { align: 'center', marginHorizontal: 16 } )
		);

		// Assert
		expect( result.current[ 0 ] ).toEqual( [
			expect.objectContaining( defaultCanvasStyles ),
			{},
		] );
		expect( result.current[ 1 ] ).toEqual( 16 );
	} );

	it( 'should return the correct wrapper styles and margin for right alignment', () => {
		// Arrange
		jest.spyOn(
			require( 'react-native' ),
			'useWindowDimensions'
		).mockReturnValue( { width: 960, height: 640 } );

		// Act
		const { result } = renderHook( () =>
			useEditorWrapperStyles( { align: 'right', marginHorizontal: 16 } )
		);

		// Assert
		expect( result.current[ 0 ] ).toEqual( [
			expect.objectContaining( defaultCanvasStyles ),
			{},
		] );
		expect( result.current[ 1 ] ).toEqual( 16 );
	} );

	it( 'should return the correct wrapper styles and margin when reversed is true', () => {
		// Arrange
		jest.spyOn(
			require( 'react-native' ),
			'useWindowDimensions'
		).mockReturnValue( { width: 800, height: 600 } );

		// Act
		const { result } = renderHook( () =>
			useEditorWrapperStyles( { reversed: true, marginHorizontal: 16 } )
		);

		// Assert
		expect( result.current[ 0 ] ).toEqual( [
			expect.objectContaining( {
				flexDirection: 'column-reverse',
				width: '100%',
				maxWidth: 580,
			} ),
			{},
		] );
		expect( result.current[ 1 ] ).toEqual( 16 );
	} );

	it( 'should return the correct wrapper styles and margin when contentResizeMode is set', () => {
		// Arrange
		jest.spyOn(
			require( 'react-native' ),
			'useWindowDimensions'
		).mockReturnValue( { width: 800, height: 600 } );

		// Act
		const { result } = renderHook( () =>
			useEditorWrapperStyles( {
				contentResizeMode: 'stretch',
				marginHorizontal: 16,
			} )
		);

		// Assert
		expect( result.current[ 0 ] ).toEqual( [
			expect.objectContaining( {
				flex: 1,
			} ),
			{},
		] );
		expect( result.current[ 1 ] ).toEqual( 16 );
	} );
} );
