jest.mock( '@wordpress/data/src/components/use-select' );
/**
 * External dependencies
 */
import { Dimensions } from 'react-native';
import { render } from 'test/helpers';
/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
/**
 * Internal dependencies
 */
import RichText from '../component/index.native';

/**
 * Mock `useSelect` with various global application settings, e.g., styles.
 *
 * @param {Object} settings the global application settings you would like to mock.
 */
const mockGlobalSettings = (
	settings = { fontSize: 'var(--wp--preset--font-size--normal)' }
) => {
	const { fontSize } = settings;
	const DEFAULT_GLOBAL_STYLES = {
		__experimentalGlobalStylesBaseStyles: { typography: { fontSize } },
	};
	const selectMock = {
		getFormatTypes: jest.fn().mockReturnValue( [] ),
		getBlockParents: jest.fn(),
		getBlock: jest.fn(),
		getSettings: jest.fn().mockReturnValue( DEFAULT_GLOBAL_STYLES ),
	};

	useSelect.mockImplementation( ( callback ) => {
		return callback( () => selectMock );
	} );
};

describe( '<RichText/>', () => {
	/**
	 * Capture initial `window` dimensions before our integration tests modify them to stage runtime fixtures.
	 * Reset to the initial `window` dimensions after each test is executed in case they were modified.
	 */
	const window = Dimensions.get( 'window' );

	beforeEach( () => {
		mockGlobalSettings( {} );
	} );

	afterEach( () => {
		Dimensions.set( { window } );
	} );

	describe( 'Font Size', () => {
		it( 'should display rich text at the DEFAULT font size.', () => {
			// Arrange
			const expectedFontSize = 16;
			// Act
			const { getByA11yLabel } = render(
				<RichText accessibilityLabel={ 'editor' } />
			);
			// Assert
			const actualFontSize = getByA11yLabel( 'editor' ).props.fontSize;
			expect( actualFontSize ).toBe( expectedFontSize );
		} );

		it( 'should display rich text at the PROVIDED font size computed from the LOCAL `fontSize` CSS.', () => {
			// Arrange
			const expectedFontSize = 32;
			// Act
			const { getByA11yLabel } = render(
				<RichText
					accessibilityLabel={ 'editor' }
					fontSize={ 'min(2em, 3em)' }
				/>
			);
			// Assert
			const actualFontSize = getByA11yLabel( 'editor' ).props.fontSize;
			expect( actualFontSize ).toBe( expectedFontSize );
		} );

		it( 'should display rich text at the PROVIDED font size computed from the LOCAL `style.fontSize` CSS.', () => {
			// Arrange
			const expectedFontSize = 32;
			// Act
			const { getByA11yLabel } = render(
				<RichText
					accessibilityLabel={ 'editor' }
					style={ { fontSize: 'min(2em, 3em)' } }
				/>
			);
			// Assert
			const actualFontSize = getByA11yLabel( 'editor' ).props.fontSize;
			expect( actualFontSize ).toBe( expectedFontSize );
		} );

		it( `should display rich text at the PROVIDED font size computed from the selected GLOBAL
		\`__experimentalGlobalStylesBaseStyles.typography.fontSize\` CSS.`, () => {
			// Arrange
			const expectedFontSize = 32;
			mockGlobalSettings( { fontSize: 'min(2em, 3em)' } );
			// Act
			const { getByA11yLabel } = render(
				<RichText accessibilityLabel={ 'editor' } />
			);
			// Assert
			const actualFontSize = getByA11yLabel( 'editor' ).props.fontSize;
			expect( actualFontSize ).toBe( expectedFontSize );
		} );

		it( `should display rich text at the font size computed from the LOCAL \`fontSize\` CSS with HIGHEST PRIORITY
		when CSS is provided ambiguously from ALL possible sources.`, () => {
			// Arrange
			const expectedFontSize = 2;
			mockGlobalSettings( { fontSize: '0' } );
			// Act
			const { getByA11yLabel } = render(
				<RichText
					accessibilityLabel={ 'editor' }
					style={ { fontSize: '1' } }
					fontSize={ '2' }
				/>
			);
			// Assert
			const actualFontSize = getByA11yLabel( 'editor' ).props.fontSize;
			expect( actualFontSize ).toBe( expectedFontSize );
		} );

		it( `should display rich text at the font size computed from the LOCAL \`style.fontSize\` CSS with
		NEXT PRIORITY when CSS is provided ambiguously from MULTIPLE possible sources EXCLUDING \`fontSize\`.`, () => {
			// Arrange
			const expectedFontSize = 1;
			mockGlobalSettings( { fontSize: '0' } );
			// Act
			const { getByA11yLabel } = render(
				<RichText
					accessibilityLabel={ 'editor' }
					style={ { fontSize: '1' } }
				/>
			);
			// Assert
			const actualFontSize = getByA11yLabel( 'editor' ).props.fontSize;
			expect( actualFontSize ).toBe( expectedFontSize );
		} );

		it( 'should display rich text at the font size computed from CSS relative to the VIEWPORT WIDTH.', () => {
			// Arrange
			const expectedFontSize = 3;
			Dimensions.set( { window: { ...window, width: 300 } } );
			// Act
			const { getByA11yLabel } = render(
				<RichText accessibilityLabel={ 'editor' } fontSize={ '1vw' } />
			);
			// Assert
			const actualFontSize = getByA11yLabel( 'editor' ).props.fontSize;
			expect( actualFontSize ).toBe( expectedFontSize );
		} );

		it( 'should display rich text at the font size computed from CSS relative to the VIEWPORT HEIGHT.', () => {
			// Arrange
			const expectedFontSize = 3;
			Dimensions.set( { window: { ...window, height: 300 } } );
			// Act
			const { getByA11yLabel } = render(
				<RichText accessibilityLabel={ 'editor' } fontSize={ '1vh' } />
			);
			// Assert
			const actualFontSize = getByA11yLabel( 'editor' ).props.fontSize;
			expect( actualFontSize ).toBe( expectedFontSize );
		} );
	} );
} );
