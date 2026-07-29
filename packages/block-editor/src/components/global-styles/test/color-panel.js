/**
 * External dependencies
 */
import { render, renderHook, screen } from '@testing-library/react';
import { click, render as renderAriakit } from '@ariakit/test/react';

/**
 * Internal dependencies
 */
import ColorPanel, {
	useHasColorPanel,
	useHasTextPanel,
	useHasBackgroundColorPanel,
	useHasLinkPanel,
	useHasHeadingPanel,
	useHasButtonPanel,
	useHasCaptionPanel,
} from '../color-panel';

// The inheritance treatment sits behind the
// `gutenberg-global-styles-inheritance-ui` experiment. Turn it on so these
// tests exercise the inheriting path.
beforeEach( () => {
	window.__experimentalGlobalStylesInheritanceUI = true;
} );

afterEach( () => {
	delete window.__experimentalGlobalStylesInheritanceUI;
} );

const settingsWithColors = ( overrides = {} ) => ( {
	color: {
		palette: {
			theme: [ { slug: 'red', color: '#ff0000', name: 'Red' } ],
		},
		...overrides,
	},
} );

describe( 'useHasColorPanel', () => {
	// After moving top-level text color to TypographyPanel and top-level
	// background color to BackgroundPanel, the Color panel only aggregates
	// link and element controls (heading, button, caption).
	it( 'should be false when only text color is enabled', () => {
		const { result } = renderHook( () =>
			useHasColorPanel( settingsWithColors( { text: true } ) )
		);
		expect( result.current ).toBeFalsy();
	} );

	it( 'should be false when only background color is enabled', () => {
		const { result } = renderHook( () =>
			useHasColorPanel( settingsWithColors( { background: true } ) )
		);
		expect( result.current ).toBeFalsy();
	} );

	it( 'should be false when both text and background are enabled but no element controls are', () => {
		const { result } = renderHook( () =>
			useHasColorPanel(
				settingsWithColors( { text: true, background: true } )
			)
		);
		expect( result.current ).toBeFalsy();
	} );

	it( 'should be true when link color is enabled', () => {
		const { result } = renderHook( () =>
			useHasColorPanel( settingsWithColors( { link: true } ) )
		);
		expect( result.current ).toBeTruthy();
	} );

	it( 'should be true when heading element is enabled', () => {
		const { result } = renderHook( () =>
			useHasColorPanel( settingsWithColors( { heading: true } ) )
		);
		expect( result.current ).toBeTruthy();
	} );

	it( 'should be true when button element is enabled', () => {
		const { result } = renderHook( () =>
			useHasColorPanel( settingsWithColors( { button: true } ) )
		);
		expect( result.current ).toBeTruthy();
	} );

	it( 'should be true when caption element is enabled', () => {
		const { result } = renderHook( () =>
			useHasColorPanel( settingsWithColors( { caption: true } ) )
		);
		expect( result.current ).toBeTruthy();
	} );

	it( 'should be false when no color controls are enabled', () => {
		const { result } = renderHook( () => useHasColorPanel( {} ) );
		expect( result.current ).toBeFalsy();
	} );
} );

describe( 'useHasTextPanel', () => {
	// Still exported for TypographyPanel to consume as its text color gate.
	it( 'should be true when text color is enabled and colors exist', () => {
		const { result } = renderHook( () =>
			useHasTextPanel( settingsWithColors( { text: true } ) )
		);
		expect( result.current ).toBeTruthy();
	} );

	it( 'should be true when text color is enabled with custom colors support', () => {
		const { result } = renderHook( () =>
			useHasTextPanel( { color: { text: true, custom: true } } )
		);
		expect( result.current ).toBeTruthy();
	} );

	it( 'should be false when text color is disabled', () => {
		const { result } = renderHook( () =>
			useHasTextPanel( settingsWithColors( { text: false } ) )
		);
		expect( result.current ).toBeFalsy();
	} );

	it( 'should be false when no colors or custom support exist', () => {
		const { result } = renderHook( () =>
			useHasTextPanel( { color: { text: true } } )
		);
		expect( result.current ).toBeFalsy();
	} );
} );

describe( 'useHasBackgroundColorPanel', () => {
	// Still exported for BackgroundPanel to consume as its background color gate.
	it( 'should be true when background is enabled and colors exist', () => {
		const { result } = renderHook( () =>
			useHasBackgroundColorPanel(
				settingsWithColors( { background: true } )
			)
		);
		expect( result.current ).toBeTruthy();
	} );

	it( 'should be true when only gradients are available', () => {
		const { result } = renderHook( () =>
			useHasBackgroundColorPanel( {
				color: {
					background: true,
					gradients: {
						theme: [
							{
								slug: 'cyan',
								gradient: 'linear-gradient(cyan, blue)',
								name: 'Cyan',
							},
						],
					},
				},
			} )
		);
		expect( result.current ).toBeTruthy();
	} );

	it( 'should be false when background color is disabled', () => {
		const { result } = renderHook( () =>
			useHasBackgroundColorPanel(
				settingsWithColors( { background: false } )
			)
		);
		expect( result.current ).toBeFalsy();
	} );
} );

describe( 'element color hooks', () => {
	it( 'useHasLinkPanel is truthy when link is enabled with colors', () => {
		const { result } = renderHook( () =>
			useHasLinkPanel( settingsWithColors( { link: true } ) )
		);
		expect( result.current ).toBeTruthy();
	} );

	it( 'useHasHeadingPanel is truthy when heading is enabled with colors', () => {
		const { result } = renderHook( () =>
			useHasHeadingPanel( settingsWithColors( { heading: true } ) )
		);
		expect( result.current ).toBeTruthy();
	} );

	it( 'useHasButtonPanel is truthy when button is enabled with colors', () => {
		const { result } = renderHook( () =>
			useHasButtonPanel( settingsWithColors( { button: true } ) )
		);
		expect( result.current ).toBeTruthy();
	} );

	it( 'useHasCaptionPanel is truthy when caption is enabled with colors', () => {
		const { result } = renderHook( () =>
			useHasCaptionPanel( settingsWithColors( { caption: true } ) )
		);
		expect( result.current ).toBeTruthy();
	} );
} );

// Inherited Global Styles label treatment for the controls the Color
// ("Elements") panel still owns after relocation — i.e. link and
// element-scoped colors. Top-level text and background color label
// treatment is covered by the Typography and Background panel tests, which
// now own those controls.
const baseSettings = {
	color: {
		link: true,
		heading: false,
		button: false,
		caption: false,
		defaultPalette: true,
		palette: {
			default: [
				{ name: 'Red', slug: 'red', color: '#ff0000' },
				{ name: 'Blue', slug: 'blue', color: '#0000ff' },
			],
		},
	},
};

describe( 'ColorPanel — duplicate-hex preset slug identity', () => {
	const duplicateHexSettings = {
		color: {
			link: true,
			defaultPalette: false,
			palette: {
				theme: [
					{
						slug: 'dark-background',
						color: '#000000',
						name: 'Dark background',
					},
					{ slug: 'dark-text', color: '#000000', name: 'Dark text' },
				],
			},
		},
	};

	it( 'marks only the local link preset as selected when another preset shares its hex', async () => {
		await renderAriakit(
			<ColorPanel
				value={ {
					elements: {
						link: {
							color: { text: 'var:preset|color|dark-text' },
						},
					},
				} }
				settings={ duplicateHexSettings }
				onChange={ () => {} }
				panelId="test-panel"
			/>
		);

		await click( screen.getByRole( 'button', { name: /^Link/ } ) );
		const swatches = await screen.findAllByRole( 'option' );

		// swatch[0] = 'Dark background', swatch[1] = 'Dark text'. Selection
		// must follow the stored slug; matching by hex would mark both.
		expect( swatches[ 1 ] ).toHaveAttribute( 'aria-selected', 'true' );
		expect( swatches[ 0 ] ).toHaveAttribute( 'aria-selected', 'false' );
	} );
} );

describe( 'ColorPanel — inherited Global Styles label treatment', () => {
	describe( 'Link color', () => {
		it( 'exposes an accessible reset when local link.text overrides the inherited value', () => {
			const inheritedValue = {
				elements: { link: { color: { text: '#0000ff' } } },
			};
			const value = {
				elements: { link: { color: { text: '#aaaaaa' } } },
			};

			render(
				<ColorPanel
					value={ value }
					inheritedValue={ inheritedValue }
					settings={ baseSettings }
					onChange={ () => {} }
					panelId="test-panel"
				/>
			);

			expect(
				screen.getAllByRole( 'button', {
					name: /reset to inherited value/i,
				} ).length
			).toBeGreaterThanOrEqual( 1 );
		} );
	} );

	// An inherited element colour can be a preset slug that isn't in the
	// block panel's palette. It must fall back to the preset's CSS custom
	// property so the swatch paints instead of rendering black.
	describe( 'inherited preset missing from the palette', () => {
		function getSwatchStyles( container ) {
			return Array.from(
				// eslint-disable-next-line testing-library/no-node-access
				container.querySelectorAll( '.component-color-indicator' )
			).map( ( node ) => node.getAttribute( 'style' ) ?? '' );
		}

		// Palette intentionally lacks `vivid-purple`.
		const settings = {
			color: {
				link: true,
				heading: true,
				defaultPalette: true,
				palette: {
					default: [ { name: 'Red', slug: 'red', color: '#ff0000' } ],
				},
			},
		};

		it( 'paints an inherited link preset via its CSS custom property', () => {
			const { container } = render(
				<ColorPanel
					value={ {} }
					inheritedValue={ {
						elements: {
							link: {
								color: {
									text: 'var:preset|color|vivid-purple',
								},
							},
						},
					} }
					settings={ settings }
					onChange={ () => {} }
					panelId="test-panel"
				/>
			);
			expect(
				getSwatchStyles( container ).some( ( s ) =>
					s.includes( 'var(--wp--preset--color--vivid-purple)' )
				)
			).toBe( true );
		} );

		it( 'paints an inherited element (heading) preset via its CSS custom property', () => {
			const { container } = render(
				<ColorPanel
					value={ {} }
					inheritedValue={ {
						elements: {
							heading: {
								color: {
									text: 'var:preset|color|vivid-purple',
								},
							},
						},
					} }
					settings={ settings }
					onChange={ () => {} }
					panelId="test-panel"
				/>
			);
			expect(
				getSwatchStyles( container ).some( ( s ) =>
					s.includes( 'var(--wp--preset--color--vivid-purple)' )
				)
			).toBe( true );
		} );
	} );
} );
