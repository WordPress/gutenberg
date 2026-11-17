import { act, render, renderHook, screen } from '@testing-library/react';
import { createElement } from '@wordpress/element';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import type { BlockSupports } from '@wordpress/blocks';
import { usePrivateStyleOverride } from '../utils';
import duotone, {
	getColorsFromDuotonePreset,
	getDuotonePresetFromColors,
} from '../duotone';

describe( 'Duotone utilities', () => {
	const duotonePalette = [
		{
			name: 'Dark grayscale',
			colors: [ '#000000', '#7f7f7f' ],
			slug: 'dark-grayscale',
		},
		{
			name: 'Grayscale',
			colors: [ '#000000', '#ffffff' ],
			slug: 'grayscale',
		},
		{
			name: 'Purple and yellow',
			colors: [ '#8c00b7', '#fcff41' ],
			slug: 'purple-yellow',
		},
	];
	describe( 'getColorsFromDuotonePreset', () => {
		it( 'should return undefined if no arguments are provided', () => {
			expect( getColorsFromDuotonePreset() ).toBeUndefined();
		} );

		it( 'should return undefined if no duotone preset is provided', () => {
			expect(
				getColorsFromDuotonePreset( undefined, duotonePalette )
			).toBeUndefined();
		} );

		it( 'should return undefined if a non-existent preset is provided', () => {
			expect(
				getColorsFromDuotonePreset(
					`var:preset|duotone|does-not-exist`,
					duotonePalette
				)
			).toBeUndefined();
		} );

		it( 'should return the colors from the preset if found', () => {
			expect(
				getColorsFromDuotonePreset(
					`var:preset|duotone|${ duotonePalette[ 2 ].slug }`,
					duotonePalette
				)
			).toEqual( duotonePalette[ 2 ].colors );
		} );
	} );

	describe( 'getDuotonePresetFromColors', () => {
		it( 'should return undefined if no arguments are provided', () => {
			expect( getDuotonePresetFromColors() ).toBeUndefined();
		} );

		it( 'should return undefined if no colors are provided', () => {
			expect(
				getDuotonePresetFromColors( undefined, duotonePalette )
			).toBeUndefined();
		} );

		it( 'should return undefined if provided colors is not of valid type', () => {
			const notAnArrayOfColorStrings = 'purple-yellow';
			expect(
				getDuotonePresetFromColors(
					notAnArrayOfColorStrings,
					duotonePalette
				)
			).toBeUndefined();
		} );

		it( 'should return undefined if no duotone palette is provided', () => {
			expect(
				getDuotonePresetFromColors( [ '#8c00b7', '#fcff41' ] )
			).toBeUndefined();
		} );

		it( 'should return undefined if the provided colors do not match any preset', () => {
			expect(
				getDuotonePresetFromColors(
					[ '#000000', '#000000' ],
					duotonePalette
				)
			).toBeUndefined();
		} );

		it( 'should return the slug of the preset if found', () => {
			expect(
				getDuotonePresetFromColors(
					duotonePalette[ 2 ].colors,
					duotonePalette
				)
			).toEqual( `var:preset|duotone|${ duotonePalette[ 2 ].slug }` );
		} );
	} );
} );

vi.mock( import( '../../components' ), async ( importOriginal ) => {
	const original = await importOriginal();
	return {
		...original,
		InspectorControls: Object.assign(
			() =>
				createElement( 'section', {
					'aria-label': 'Duotone inspector',
				} ),
			{ Slot: original.InspectorControls.Slot }
		),
		BlockControls: Object.assign(
			() =>
				createElement( 'section', { 'aria-label': 'Duotone toolbar' } ),
			{ Slot: original.BlockControls.Slot }
		),
	};
} );

vi.mock(
	import( '../../components/use-settings' ),
	async ( importOriginal ) => ( {
		...( await importOriginal() ),
		useSettings: ( ...paths: string[] ) =>
			paths.map( ( path ) => {
				if ( path === 'color.duotone.theme' ) {
					return [
						{
							name: 'Grayscale',
							slug: 'grayscale',
							colors: [ '#000000', '#ffffff' ],
						},
					];
				}
				return path.endsWith( '.custom' ) ||
					path.endsWith( '.theme' ) ||
					path.endsWith( '.default' )
					? []
					: true;
			} ),
	} )
);

vi.mock(
	import( '../../components/global-styles/inherited-value-context' ),
	async ( importOriginal ) => ( {
		...( await importOriginal() ),
		useResolvedStyle: () => ( { value: {} } ),
	} )
);

vi.mock( import( '../utils' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	usePrivateStyleOverride: vi.fn(),
} ) );

describe( 'Duotone default controls', () => {
	const name = 'test/duotone';

	afterEach( () => {
		act( () => {
			unregisterBlockType( name );
		} );
		vi.clearAllMocks();
	} );

	function register(
		support: NonNullable< BlockSupports[ 'filter' ] >[ 'duotone' ]
	) {
		registerBlockType( name, {
			apiVersion: 3,
			attributes: {},
			title: 'Duotone test',
			category: 'design',
			save: () => null,
			supports: { filter: { duotone: support } },
		} );
	}

	it.each( [ true, {}, { defaultControls: true } ] )(
		'keeps the inspector and toolbar controls for %j',
		( support ) => {
			register( support );
			render(
				createElement( duotone.edit, {
					name,
					clientId: 'duotone-test',
					setAttributes: vi.fn(),
				} )
			);
			expect(
				screen.getByRole( 'region', { name: 'Duotone inspector' } )
			).toBeVisible();
			expect(
				screen.getByRole( 'region', { name: 'Duotone toolbar' } )
			).toBeVisible();
		}
	);

	it( 'suppresses both default controls without disabling support', () => {
		register( { defaultControls: false } );
		render(
			createElement( duotone.edit, {
				name,
				clientId: 'duotone-test',
				setAttributes: vi.fn(),
			} )
		);
		expect(
			screen.queryByRole( 'region', { name: 'Duotone inspector' } )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'region', { name: 'Duotone toolbar' } )
		).not.toBeInTheDocument();
		expect( duotone.hasSupport( name ) ).toBe( true );
	} );

	it( 'still generates the editor filter and stylesheet', () => {
		register( { defaultControls: false } );
		const { result } = renderHook( () =>
			duotone.useBlockProps( {
				name,
				clientId: 'duotone-test',
				style: { color: { duotone: 'var:preset|duotone|grayscale' } },
			} )
		);
		expect( result.current.className ).toMatch( /^wp-duotone-/ );
		expect( usePrivateStyleOverride ).toHaveBeenCalledWith(
			expect.objectContaining( {
				css: expect.stringContaining( 'filter:' ),
			} )
		);
		expect( usePrivateStyleOverride ).toHaveBeenCalledWith(
			expect.objectContaining( {
				assets: expect.stringContaining( '<filter' ),
			} )
		);
	} );
} );
