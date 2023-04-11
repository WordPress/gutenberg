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
import {
	getBlockMargin,
	getFullWidthStyles,
	getWideWidthStyles,
	useEditorWrapperStyles,
} from '../use-editor-wrapper-styles';

jest.mock( '../use-editor-wrapper-styles.scss', () => ( {
	'block-editor-hooks__use-editor-wrapper-styles': {
		width: '100%',
		maxWidth: 580,
		alignSelf: 'center',
	},
	'block-editor-hooks__use-editor-wrapper-styles--reversed': {
		flexDirection: 'column-reverse',
		width: '100%',
		maxWidth: 580,
	},
	'block-editor-hooks__use-editor-wrapper-styles-alignment--full': {
		maxWidth: '100%',
	},
	'block-editor-hooks__use-editor-wrapper-styles-alignment--wide': {
		maxWidth: 1054,
	},
	'block-editor-hooks__use-editor-wrapper-styles-alignment--wide-medium': {
		maxWidth: 770,
	},
	'block-editor-hooks__use-editor-wrapper-styles-alignment--wide-landscape': {
		maxWidth: 662,
	},
	'block-editor-hooks__use-editor-wrapper-styles-block': {
		marginLeft: 16,
	},
} ) );

const defaultCanvasStyles = {
	width: '100%',
	maxWidth: 580,
	alignSelf: 'center',
};

describe( 'getWideWidthStyles', () => {
	it( 'should return empty object for non-wide alignment', () => {
		const result = getWideWidthStyles( 'full', false, 500 );
		expect( result ).toEqual( {} );
	} );

	it( 'should return wide-landscape styles in landscape mode with width less than large breakpoint', () => {
		const result = getWideWidthStyles( 'wide', true, 900 );
		expect( result ).toEqual( { maxWidth: 770 } );
	} );

	it( 'should return maxWidth equal to width if width is less than or equal to small breakpoint', () => {
		const result = getWideWidthStyles( 'wide', false, 480 );
		expect( result ).toEqual( { maxWidth: 480 } );
	} );

	it( 'should return wide-medium styles if width is between medium and wide breakpoints', () => {
		const result = getWideWidthStyles( 'wide', false, 1000 );
		expect( result ).toEqual( { maxWidth: 770 } );
	} );

	it( 'should return wide styles if width is greater than or equal to wide breakpoint', () => {
		const result = getWideWidthStyles( 'wide', false, 1280 );
		expect( result ).toEqual( { maxWidth: 1054 } );
	} );
} );

describe( 'getFullWidthStyles', () => {
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

	it( 'should return full styles for full width alignment without parents', () => {
		const result = getFullWidthStyles( 'full', 'core/column', false );
		expect( result ).toEqual( { maxWidth: '100%' } );
	} );

	it( 'should return paddingHorizontal style for container-related block with parents and non-container-related parent block', () => {
		const result = getFullWidthStyles(
			undefined,
			'core/column',
			true,
			'core/cover'
		);
		expect( result ).toEqual( {
			paddingHorizontal: 16,
		} );
	} );

	it( 'should return empty object for non-full width alignment', () => {
		const result = getFullWidthStyles( 'left', 'core/group', false );
		expect( result ).toEqual( {} );
	} );

	it( 'should return empty object for container-related block with container-related parent block', () => {
		const result = getFullWidthStyles(
			undefined,
			'core/columns',
			true,
			'core/column'
		);
		expect( result ).toEqual( {} );
	} );
} );

describe( 'getBlockMargin', () => {
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

	it( 'should return 0 for full width alignment without parents', () => {
		const result = getBlockMargin( 'full', 'core/cover', 300, false );
		expect( result ).toBe( 0 );
	} );

	it( 'should return default margin for full width alignment with parents', () => {
		const result = getBlockMargin( 'full', 'core/cover', 300, true );
		expect( result ).toBe( 16 );
	} );

	it( 'should return default margin for wide width alignment', () => {
		const result = getBlockMargin( 'wide', 'core/columns', 300, false );
		expect( result ).toBe( 16 );
	} );

	it( 'should return default margin for full width parent alignment and container-related block', () => {
		const result = getBlockMargin(
			undefined,
			'core/cover',
			300,
			true,
			'full',
			'core/group',
			1024,
			1024
		);
		expect( result ).toBe( 16 );
	} );

	it( 'should return double default margin for full width parent alignment, non-wider block width', () => {
		const result = getBlockMargin(
			undefined,
			'core/cover',
			300,
			true,
			'full',
			'core/columns',
			320,
			320
		);
		expect( result ).toBe( 32 );
	} );

	it( 'should return default margin for container-related parent block and non-container-related block with equal parent width and screen width', () => {
		const result = getBlockMargin(
			undefined,
			'core/cover',
			300,
			true,
			undefined,
			'core/columns',
			1024,
			1024
		);
		expect( result ).toBe( 16 );
	} );

	it( 'should return default margin for other cases', () => {
		const result = getBlockMargin(
			undefined,
			'core/paragraph',
			300,
			true,
			undefined,
			'core/group'
		);
		expect( result ).toBe( 16 );
	} );
} );

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

	it( 'should return the default wrapper styles and margin when no props are set', () => {
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
		expect( result.current[ 1 ] ).toEqual( 16 );
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
			useEditorWrapperStyles( { align: 'left' } )
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
			useEditorWrapperStyles( { align: 'center' } )
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
			useEditorWrapperStyles( { align: 'right' } )
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
			useEditorWrapperStyles( { reversed: true } )
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
			useEditorWrapperStyles( { contentResizeMode: 'stretch' } )
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
