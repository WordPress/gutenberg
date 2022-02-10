/**
 * External dependencies
 */
import { Dimensions } from 'react-native';
import { getEditorHtml, render, initializeEditor } from 'test/helpers';

/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { coreBlocks, registerBlock } from '@wordpress/block-library';
import {
	getBlockTypes,
	setDefaultBlockName,
	unregisterBlockType,
} from '@wordpress/blocks';
import '@wordpress/jest-console';

/**
 * Internal dependencies
 */
import { store as richTextStore } from '../store';
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
	jest.spyOn( select( blockEditorStore ), 'getSettings' ).mockReturnValue(
		DEFAULT_GLOBAL_STYLES
	);
	jest.spyOn( select( richTextStore ), 'getFormatTypes' ).mockReturnValue(
		[]
	);
};

describe( '<RichText/>', () => {
	/**
	 * Capture initial `window` dimensions before our integration tests modify them to stage runtime fixtures.
	 * Reset to the initial `window` dimensions after each test is executed in case they were modified.
	 */
	const window = Dimensions.get( 'window' );

	const decimalUnitsData = [
		[ '1.125rem', 18 ],
		[ '10.52px', 11 ],
		[ '2.3136em', 37 ],
		[ '1.42vh', 19 ],
	];

	beforeAll( () => {
		// Register Paragraph block
		const paragraph = coreBlocks[ 'core/paragraph' ];
		registerBlock( paragraph );
		setDefaultBlockName( paragraph.name );
	} );

	beforeEach( () => {
		mockGlobalSettings( {} );
	} );

	afterEach( () => {
		Dimensions.set( { window } );
	} );

	afterAll( () => {
		// Clean up registered blocks
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
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

		it( `should display rich text with the default editor font size value and not use the
		\`default font size value from the global styles for a tag different than (p)`, () => {
			// Arrange
			const defaultFontSize = 16;
			mockGlobalSettings( { fontSize: 'min(2em, 3em)' } );
			// Act
			const { getByA11yLabel } = render(
				<RichText accessibilityLabel={ 'editor' } tagName="div" />
			);
			// Assert
			const actualFontSize = getByA11yLabel( 'editor' ).props.fontSize;
			expect( actualFontSize ).toBe( defaultFontSize );
		} );

		it( `should display rich text at the PROVIDED font size computed from the selected GLOBAL
		\`__experimentalGlobalStylesBaseStyles.typography.fontSize\` CSS.`, () => {
			// Arrange
			const expectedFontSize = 32;
			mockGlobalSettings( { fontSize: 'min(2em, 3em)' } );
			// Act
			const { getByA11yLabel } = render(
				<RichText accessibilityLabel={ 'editor' } tagName="p" />
			);
			// Assert
			const actualFontSize = getByA11yLabel( 'editor' ).props.fontSize;
			expect( actualFontSize ).toBe( expectedFontSize );
		} );

		test.each( decimalUnitsData )(
			`should display rich text at the PROVIDED font size computed from the selected GLOBAL
		\`__experimentalGlobalStylesBaseStyles.typography.fontSize\` CSS with decimal value: %s`,
			( unit, expected ) => {
				// Arrange
				mockGlobalSettings( { fontSize: unit } );
				// Act
				const { getByA11yLabel } = render(
					<RichText accessibilityLabel={ 'editor' } tagName="p" />
				);
				// Assert
				const actualFontSize = getByA11yLabel( 'editor' ).props
					.fontSize;
				expect( actualFontSize ).toBe( expected );
			}
		);

		it( `should display rich text at the font size computed from the LOCAL \`style.fontSize\` CSS with HIGHEST PRIORITY
		when CSS is provided ambiguously from ALL possible sources.`, () => {
			// Arrange
			const expectedFontSize = 1;
			mockGlobalSettings( { fontSize: '0' } );
			// Act
			const { getByA11yLabel } = render(
				<RichText
					accessibilityLabel={ 'editor' }
					style={ { fontSize: '1' } }
					fontSize={ '2' }
					tagName="p"
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
					tagName="p"
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

		it( 'should update the font size when style prop with font size property is provided', () => {
			// Arrange
			const fontSize = '10';
			const style = { fontSize: '12' };
			// Act
			const screen = render( <RichText fontSize={ fontSize } /> );
			screen.update( <RichText fontSize={ fontSize } style={ style } /> );
			// Assert
			expect( screen.toJSON() ).toMatchSnapshot();
		} );

		it( 'renders component with style and font size', async () => {
			// Arrange
			const initialHtml = `<!-- wp:paragraph {"style":{"color":{"text":"#fcb900"},"typography":{"fontSize":35.56}}} -->
					<p class="has-text-color" style="color:#fcb900;font-size:35.56px">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed imperdiet ut nibh vitae ornare. Sed auctor nec augue at blandit.</p>
					<!-- /wp:paragraph -->`;
			// Act
			await initializeEditor( { initialHtml } );
			// Assert
			expect( getEditorHtml() ).toMatchSnapshot();
		} );

		it( 'should update the font size with decimals when style prop with font size property is provided', () => {
			// Arrange
			const fontSize = '10';
			const style = { fontSize: '12.56px' };
			// Act
			const screen = render( <RichText fontSize={ fontSize } /> );
			screen.update( <RichText fontSize={ fontSize } style={ style } /> );
			// Assert
			expect( screen.toJSON() ).toMatchSnapshot();
		} );

		it( 'should set the default minimum line height value if the provided value from the styles is lower', () => {
			// Arrange
			const expectedLineHeight = 1;
			const style = { lineHeight: 0.2 };
			// Act
			const { getByA11yLabel } = render(
				<RichText accessibilityLabel={ 'editor' } style={ style } />
			);
			// Assert
			const actualFontSize = getByA11yLabel( 'editor' ).props.lineHeight;
			expect( actualFontSize ).toBe( expectedLineHeight );
		} );
	} );
} );
