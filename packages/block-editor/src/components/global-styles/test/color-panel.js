/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

/**
 * Internal dependencies
 */
import {
	useHasColorPanel,
	useHasTextPanel,
	useHasBackgroundColorPanel,
	useHasLinkPanel,
	useHasHeadingPanel,
	useHasButtonPanel,
	useHasCaptionPanel,
} from '../color-panel';

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
