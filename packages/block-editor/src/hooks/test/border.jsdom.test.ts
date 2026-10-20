import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	createBlock,
	registerBlockStyle,
	registerBlockType,
	unregisterBlockStyle,
	unregisterBlockType,
} from '@wordpress/blocks';
import { dispatch } from '@wordpress/data';
import border, {
	applyBorderStyleDefaults,
	getBorderStyleFallbacks,
	getInheritedBorderStyles,
} from '../border';
import { store as blockEditorStore } from '../../store';
import { globalStylesDataKey } from '../../store/private-keys';
import { unlock } from '../../lock-unlock';

vi.mock(
	import( '../../components/use-settings' ),
	async ( importOriginal ) => ( {
		...( await importOriginal() ),
		useSettings: () => [ [], [], [] ],
	} )
);

describe( 'getInheritedBorderStyles', () => {
	const NO_INHERITANCE_RESULT = {
		shorthand: false,
		top: false,
		right: false,
		bottom: false,
		left: false,
	};
	const FULL_INHERITANCE_RESULT = {
		shorthand: true,
		top: true,
		right: true,
		bottom: true,
		left: true,
	};

	it( 'returns all-false when there are no inherited border subtrees', () => {
		expect( getInheritedBorderStyles( undefined, undefined ) ).toEqual(
			NO_INHERITANCE_RESULT
		);
	} );

	it( 'ignores a root-level border style (does not propagate to inner blocks)', () => {
		// Root styles compile to a `body` selector and `border-style` is
		// not a CSS-inherited property. The helper takes only the block
		// and variation borders; callers should not pass root.
		expect( getInheritedBorderStyles( undefined, undefined ) ).toEqual(
			NO_INHERITANCE_RESULT
		);
	} );

	it( 'detects a shorthand inherited style at block-type level', () => {
		expect(
			getInheritedBorderStyles( { style: 'dotted' }, undefined )
		).toEqual( FULL_INHERITANCE_RESULT );
	} );

	it( 'detects a per-side inherited style at block-type level', () => {
		expect(
			getInheritedBorderStyles( { top: { style: 'dashed' } }, undefined )
		).toEqual( {
			shorthand: false,
			top: true,
			right: false,
			bottom: false,
			left: false,
		} );
	} );

	it( 'detects an inherited style at block style variation level', () => {
		expect(
			getInheritedBorderStyles( undefined, { style: 'solid' } )
		).toEqual( FULL_INHERITANCE_RESULT );
	} );

	it( 'combines per-side inheritance across block and variation', () => {
		expect(
			getInheritedBorderStyles(
				{ top: { style: 'dashed' } },
				{ right: { style: 'dotted' } }
			)
		).toEqual( {
			shorthand: false,
			top: true,
			right: true,
			bottom: false,
			left: false,
		} );
	} );

	it( 'treats variation shorthand style as covering all sides', () => {
		expect(
			getInheritedBorderStyles(
				{ top: { style: 'dashed' } },
				{ style: 'solid' }
			)
		).toEqual( FULL_INHERITANCE_RESULT );
	} );

	describe( "non-rendering styles ('none' / 'hidden')", () => {
		it( "does not treat shorthand 'none' as inherited", () => {
			expect(
				getInheritedBorderStyles( { style: 'none' }, undefined )
			).toEqual( NO_INHERITANCE_RESULT );
		} );

		it( "does not treat shorthand 'hidden' as inherited", () => {
			expect(
				getInheritedBorderStyles( { style: 'hidden' }, undefined )
			).toEqual( NO_INHERITANCE_RESULT );
		} );

		it( "does not treat per-side 'none' as inherited", () => {
			expect(
				getInheritedBorderStyles(
					{ top: { style: 'none' } },
					undefined
				)
			).toEqual( NO_INHERITANCE_RESULT );
		} );

		it( "treats a rendering style alongside 'none' on another side as inherited only for the rendering side", () => {
			expect(
				getInheritedBorderStyles(
					{
						top: { style: 'none' },
						right: { style: 'dashed' },
					},
					undefined
				)
			).toEqual( {
				shorthand: false,
				top: false,
				right: true,
				bottom: false,
				left: false,
			} );
		} );
	} );
} );

describe( 'applyBorderStyleDefaults', () => {
	const NO_INHERITANCE = {
		shorthand: false,
		top: false,
		right: false,
		bottom: false,
		left: false,
	};

	it( 'returns undefined input unchanged', () => {
		expect(
			applyBorderStyleDefaults( undefined, NO_INHERITANCE )
		).toBeUndefined();
	} );

	describe( 'uniform (shorthand) borders', () => {
		it( 'defaults to solid when color is set without style', () => {
			expect(
				applyBorderStyleDefaults( { color: '#000' }, NO_INHERITANCE )
			).toEqual( { color: '#000', style: 'solid' } );
		} );

		it( 'defaults to solid when width is set without style', () => {
			expect(
				applyBorderStyleDefaults( { width: '2px' }, NO_INHERITANCE )
			).toEqual( { width: '2px', style: 'solid' } );
		} );

		it( 'does not override an explicit style', () => {
			expect(
				applyBorderStyleDefaults(
					{ color: '#000', style: 'dashed' },
					NO_INHERITANCE
				)
			).toEqual( { color: '#000', style: 'dashed' } );
		} );

		it( 'does not add a style when shorthand inheritance exists', () => {
			expect(
				applyBorderStyleDefaults(
					{ color: '#000' },
					{ ...NO_INHERITANCE, shorthand: true }
				)
			).toEqual( { color: '#000' } );
		} );

		it( 'does not add a style when only radius is present', () => {
			expect(
				applyBorderStyleDefaults( { radius: '4px' }, NO_INHERITANCE )
			).toEqual( { radius: '4px' } );
		} );
	} );

	describe( 'split borders', () => {
		it( 'defaults solid per side when color/width is set without style', () => {
			expect(
				applyBorderStyleDefaults(
					{
						top: { color: '#000' },
						right: { width: '2px' },
						bottom: { color: '#fff', width: '1px' },
						left: { color: '#ccc', style: 'dashed' },
					},
					NO_INHERITANCE
				)
			).toEqual( {
				top: { color: '#000', style: 'solid' },
				right: { width: '2px', style: 'solid' },
				bottom: { color: '#fff', width: '1px', style: 'solid' },
				left: { color: '#ccc', style: 'dashed' },
			} );
		} );

		it( 'applies shorthand and per-side defaults on mixed shapes', () => {
			// `hasSplitBorders` returns true if any per-side key exists, so a
			// mixed shape used to skip the shorthand-level default entirely.
			// The unified helper handles both levels in a single pass.
			expect(
				applyBorderStyleDefaults(
					{
						color: '#000',
						top: { color: '#fff' },
					},
					NO_INHERITANCE
				)
			).toEqual( {
				color: '#000',
				top: { color: '#fff', style: 'solid' },
			} );
		} );

		it( 'skips sides where inheritance exists', () => {
			expect(
				applyBorderStyleDefaults(
					{
						top: { color: '#000' },
						right: { color: '#000' },
						bottom: { color: '#000' },
						left: { color: '#000' },
					},
					{ ...NO_INHERITANCE, top: true, left: true }
				)
			).toEqual( {
				top: { color: '#000' },
				right: { color: '#000', style: 'solid' },
				bottom: { color: '#000', style: 'solid' },
				left: { color: '#000' },
			} );
		} );

		it( 'does not mutate the input', () => {
			const input = {
				top: { color: '#000' },
				right: { color: '#111' },
				bottom: { color: '#222' },
				left: { color: '#333' },
			};
			const snapshot = JSON.parse( JSON.stringify( input ) );
			applyBorderStyleDefaults( input, NO_INHERITANCE );
			expect( input ).toEqual( snapshot );
		} );
	} );
} );

describe( 'getBorderStyleFallbacks', () => {
	const NO_INHERITANCE = {
		shorthand: false,
		top: false,
		right: false,
		bottom: false,
		left: false,
	};

	it( 'returns empty when no border attributes are set', () => {
		expect( getBorderStyleFallbacks( {}, NO_INHERITANCE ) ).toEqual( {} );
	} );

	it( 'returns empty when called with no arguments', () => {
		expect( getBorderStyleFallbacks() ).toEqual( {} );
	} );

	it( 'returns empty when an explicit shorthand style is already present', () => {
		expect(
			getBorderStyleFallbacks(
				{ style: { border: { color: '#000', style: 'dashed' } } },
				NO_INHERITANCE
			)
		).toEqual( {} );
	} );

	it( 'emits per-side solid for shorthand color/width without style', () => {
		expect(
			getBorderStyleFallbacks(
				{ style: { border: { color: '#000' } } },
				NO_INHERITANCE
			)
		).toEqual( {
			borderTopStyle: 'solid',
			borderRightStyle: 'solid',
			borderBottomStyle: 'solid',
			borderLeftStyle: 'solid',
		} );
	} );

	it( 'emits per-side solid for borderColor preset attribute', () => {
		expect(
			getBorderStyleFallbacks( { borderColor: 'accent' }, NO_INHERITANCE )
		).toEqual( {
			borderTopStyle: 'solid',
			borderRightStyle: 'solid',
			borderBottomStyle: 'solid',
			borderLeftStyle: 'solid',
		} );
	} );

	it( 'skips sides where inheritance applies', () => {
		expect(
			getBorderStyleFallbacks(
				{ style: { border: { width: '2px' } } },
				{ ...NO_INHERITANCE, top: true, bottom: true }
			)
		).toEqual( {
			borderRightStyle: 'solid',
			borderLeftStyle: 'solid',
		} );
	} );

	it( 'skips all sides when shorthand inheritance applies', () => {
		expect(
			getBorderStyleFallbacks(
				{ style: { border: { color: '#000' } } },
				{
					shorthand: true,
					top: true,
					right: true,
					bottom: true,
					left: true,
				}
			)
		).toEqual( {} );
	} );

	it( 'emits per-side solid only for the side that needs it', () => {
		expect(
			getBorderStyleFallbacks(
				{
					style: {
						border: {
							top: { color: '#000', style: 'dashed' },
							right: { color: '#000' },
						},
					},
				},
				NO_INHERITANCE
			)
		).toEqual( { borderRightStyle: 'solid' } );
	} );

	describe( 'mixed shorthand + per-side data', () => {
		it( 'does not clobber a side with an explicit per-side style when shorthand color is set', () => {
			// Shorthand color but no shorthand style; one side has its
			// own explicit dashed style. That side must keep dashed; the
			// other three need fallback solid via the shorthand value.
			expect(
				getBorderStyleFallbacks(
					{
						style: {
							border: {
								color: '#000',
								top: { color: '#fff', style: 'dashed' },
							},
						},
					},
					NO_INHERITANCE
				)
			).toEqual( {
				borderRightStyle: 'solid',
				borderBottomStyle: 'solid',
				borderLeftStyle: 'solid',
			} );
		} );

		it( 'emits nothing when the shorthand provides a style — it covers all sides via the cascade', () => {
			expect(
				getBorderStyleFallbacks(
					{
						style: {
							border: {
								style: 'dashed',
								top: { color: '#fff' },
								right: { color: '#fff' },
							},
						},
					},
					NO_INHERITANCE
				)
			).toEqual( {} );
		} );

		it( 'emits per-side solid for sides covered by shorthand color when no style is set anywhere', () => {
			expect(
				getBorderStyleFallbacks(
					{
						style: {
							border: {
								color: '#000',
								top: { color: '#fff' },
							},
						},
					},
					NO_INHERITANCE
				)
			).toEqual( {
				borderTopStyle: 'solid',
				borderRightStyle: 'solid',
				borderBottomStyle: 'solid',
				borderLeftStyle: 'solid',
			} );
		} );
	} );
} );

describe( 'border useBlockProps', () => {
	const BLOCK_NAME = 'test/border-defaults';
	const SOLID_FALLBACKS = {
		borderTopStyle: 'solid',
		borderRightStyle: 'solid',
		borderBottomStyle: 'solid',
		borderLeftStyle: 'solid',
	};
	const widthOnly = { border: { width: '2px' } };

	// `updateSettings` drops symbol keys, so set the private key directly.
	function setGlobalStyles( styles: Record< string, unknown > | undefined ) {
		unlock( dispatch( blockEditorStore ) ).__experimentalUpdateSettings( {
			[ globalStylesDataKey ]: styles,
		} );
	}

	type BorderBlockProps = Parameters< typeof border.useBlockProps >[ 0 ];

	function getStyle( props: Partial< BorderBlockProps > ) {
		const { result, unmount } = renderHook( () =>
			border.useBlockProps( {
				name: BLOCK_NAME,
				...props,
			} as BorderBlockProps )
		);
		unmount();
		return ( result.current as { style?: Record< string, string > } ).style;
	}

	beforeEach( () => {
		registerBlockType( BLOCK_NAME, {
			apiVersion: 3,
			title: 'Test block',
			category: 'design',
			save: () => null,
			// The custom class name hook that adds `className` is not loaded here.
			attributes: { className: { type: 'string' } },
			supports: { __experimentalBorder: { color: true, width: true } },
		} );
		registerBlockStyle( BLOCK_NAME, { name: 'framed', label: 'Framed' } );
	} );

	afterEach( () => {
		setGlobalStyles( undefined );
		dispatch( blockEditorStore ).resetBlocks( [] );
		unregisterBlockStyle( BLOCK_NAME, 'framed' );
		unregisterBlockType( BLOCK_NAME );
	} );

	it( 'falls back to solid when Global Styles set no border style', () => {
		setGlobalStyles( {} );
		expect( getStyle( { style: widthOnly } ) ).toMatchObject(
			SOLID_FALLBACKS
		);
	} );

	it( 'uses the block type border style from Global Styles', () => {
		setGlobalStyles( {
			blocks: { [ BLOCK_NAME ]: { border: { style: 'dashed' } } },
		} );
		expect( getStyle( { style: widthOnly } ) ).not.toHaveProperty(
			'borderTopStyle'
		);
	} );

	it( 'uses the block style variation border style from Global Styles', () => {
		const block = createBlock( BLOCK_NAME, {
			className: 'is-style-framed',
		} );
		dispatch( blockEditorStore ).resetBlocks( [ block ] );
		setGlobalStyles( {
			blocks: {
				[ BLOCK_NAME ]: {
					variations: { framed: { border: { style: 'dotted' } } },
				},
			},
		} );
		expect(
			getStyle( { clientId: block.clientId, style: widthOnly } )
		).not.toHaveProperty( 'borderTopStyle' );
	} );
} );
