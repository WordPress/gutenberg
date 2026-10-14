import { describe, expect, it } from 'vitest';
import {
	getStyleSourceRows,
	getResetAttributes,
} from '../use-style-source-rows';

const base = {
	blockTitle: 'Button',
	variationLabel: 'Outline',
	supportedPaths: [
		'color.text',
		'color.background',
		'typography.fontSize',
		'typography.letterSpacing',
		'typography.fontFamily',
		'spacing.padding',
	],
};

describe( 'getStyleSourceRows', () => {
	it( 'flags a local value over an inherited one as an override', () => {
		const { changed, inherited } = getStyleSourceRows( {
			...base,
			attributes: { style: { typography: { fontSize: '20px' } } },
			inheritedValue: { typography: { fontSize: '14px' } },
			sources: { 'typography.fontSize': { layer: 'block' } },
		} );

		expect( changed ).toHaveLength( 1 );
		expect( changed[ 0 ] ).toMatchObject( {
			id: 'typography.fontSize',
			label: 'Font size',
			value: '20px',
			isOverride: true,
			replacedValue: '14px',
			sourceLabel: 'Button block',
		} );
		expect( inherited ).toHaveLength( 0 );
	} );

	it( 'keeps a local value that overrides nothing', () => {
		const { changed } = getStyleSourceRows( {
			...base,
			attributes: { style: { typography: { letterSpacing: '1px' } } },
		} );

		expect( changed ).toHaveLength( 1 );
		expect( changed[ 0 ] ).toMatchObject( {
			id: 'typography.letterSpacing',
			value: '1px',
			isOverride: false,
			replacedValue: undefined,
			sourceLabel: 'Not set in Global Styles',
		} );
	} );

	it( 'treats a preset attribute as a local value', () => {
		const { changed } = getStyleSourceRows( {
			...base,
			attributes: { textColor: 'vivid-red' },
			inheritedValue: { color: { text: 'var:preset|color|accent' } },
			sources: { 'color.text': { layer: 'blockVariation' } },
		} );

		expect( changed[ 0 ] ).toMatchObject( {
			id: 'color.text',
			value: 'Vivid Red',
			replacedValue: 'Accent',
			sourceLabel: 'Outline style',
			presetAttributes: [ 'textColor' ],
		} );
	} );

	it( 'drops rows that resolve to no value, and overrides of them', () => {
		const { changed, inherited } = getStyleSourceRows( {
			...base,
			attributes: { style: { typography: { letterSpacing: '1px' } } },
			inheritedValue: {
				typography: { letterSpacing: 'inherit', fontFamily: 'inherit' },
				color: { gradient: 'transparent none', background: 'none' },
			},
			sources: {
				'typography.letterSpacing': { layer: 'element' },
				'typography.fontFamily': { layer: 'element' },
				'color.gradient': { layer: 'blockVariation' },
				'color.background': { layer: 'element' },
			},
			supportedPaths: [ ...base.supportedPaths, 'color.gradient' ],
			elements: [ 'button' ],
			elementStyles: {
				button: {
					typography: {
						letterSpacing: 'inherit',
						fontFamily: 'inherit',
					},
					color: { background: 'none' },
				},
			},
		} );

		expect( changed[ 0 ] ).toMatchObject( {
			isOverride: false,
			replacedValue: undefined,
			sourceLabel: 'Not set in Global Styles',
		} );
		expect( inherited ).toEqual( [] );
	} );

	it( 'keeps a plain `transparent` color', () => {
		const { inherited } = getStyleSourceRows( {
			...base,
			attributes: {},
			inheritedValue: { color: { background: 'transparent' } },
			sources: { 'color.background': { layer: 'blockVariation' } },
		} );

		expect( inherited[ 0 ] ).toMatchObject( {
			value: 'transparent',
			sourceLabel: 'Outline style',
		} );
	} );

	it( 'merges border parts from one source into one row', () => {
		const { inherited } = getStyleSourceRows( {
			...base,
			attributes: {},
			inheritedValue: {
				border: { width: '1px', style: 'solid', color: 'currentColor' },
			},
			sources: {
				'border.width': { layer: 'blockVariation' },
				'border.style': { layer: 'blockVariation' },
				'border.color': { layer: 'blockVariation' },
			},
			supportedPaths: [ 'border.width', 'border.style', 'border.color' ],
		} );

		expect( inherited ).toHaveLength( 1 );
		expect( inherited[ 0 ] ).toMatchObject( {
			id: 'border',
			label: 'Border',
			value: '1px solid currentColor',
			sourceLabel: 'Outline style',
		} );
	} );

	it( 'keeps border parts apart when their sources differ', () => {
		const { inherited } = getStyleSourceRows( {
			...base,
			attributes: {},
			inheritedValue: { border: { width: '1px', style: 'solid' } },
			sources: {
				'border.width': { layer: 'blockVariation' },
				'border.style': { layer: 'block' },
			},
			supportedPaths: [ 'border.width', 'border.style' ],
		} );

		expect( inherited.map( ( row ) => row.id ) ).toEqual( [
			'border.width',
			'border.style',
		] );
	} );

	it( 'lists inherited values with their source', () => {
		const { inherited } = getStyleSourceRows( {
			...base,
			attributes: {},
			inheritedValue: {
				typography: { fontFamily: 'Serif' },
				color: { background: 'var:preset|color|accent' },
			},
			sources: {
				'typography.fontFamily': { layer: 'root' },
				'color.background': { layer: 'element' },
			},
			elements: [ 'button' ],
			elementStyles: {
				button: { color: { background: 'var:preset|color|accent' } },
			},
		} );

		expect( inherited.map( ( row ) => row.sourceLabel ) ).toEqual( [
			'Site typography',
			'Button element',
		] );
	} );

	it( 'names the highest element layer that sets the value', () => {
		const { inherited } = getStyleSourceRows( {
			...base,
			attributes: {},
			inheritedValue: { typography: { fontSize: '2rem' } },
			sources: { 'typography.fontSize': { layer: 'element' } },
			elements: [ 'heading', 'h2' ],
			elementStyles: {
				heading: { typography: { fontSize: '1rem' } },
				h2: { typography: { fontSize: '2rem' } },
			},
		} );

		expect( inherited[ 0 ].sourceLabel ).toBe( 'H2 element' );
	} );

	it( 'groups per-side leaves into one row', () => {
		const { changed } = getStyleSourceRows( {
			...base,
			attributes: {
				style: {
					spacing: { padding: { top: '1px', bottom: '1px' } },
				},
			},
		} );

		expect( changed ).toHaveLength( 1 );
		expect( changed[ 0 ].id ).toBe( 'spacing.padding' );
	} );

	it( 'leaves out custom CSS, state styles, element passthroughs and unsupported styles', () => {
		const { changed, inherited } = getStyleSourceRows( {
			...base,
			attributes: {
				style: {
					css: 'color: red;',
					':hover': { color: { text: 'red' } },
				},
			},
			inheritedValue: {
				elements: { link: { color: { text: 'blue' } } },
				dimensions: { minHeight: '10px' },
			},
			sources: {
				'elements.link.color.text': { layer: 'root' },
				'dimensions.minHeight': { layer: 'block' },
			},
		} );

		expect( changed ).toHaveLength( 0 );
		expect( inherited ).toHaveLength( 0 );
	} );
} );

describe( 'getResetAttributes', () => {
	const attributes = {
		textColor: 'vivid-red',
		style: {
			css: 'color: red;',
			typography: { fontSize: '20px', letterSpacing: '1px' },
		},
	};
	const { changed } = getStyleSourceRows( { ...base, attributes } );

	it( 'resets one row and keeps the rest', () => {
		const row = changed.find( ( { id } ) => id === 'typography.fontSize' );
		expect( getResetAttributes( attributes, [ row ] ) ).toEqual( {
			style: {
				css: 'color: red;',
				typography: { letterSpacing: '1px' },
			},
		} );
	} );

	it( 'resets every row, keeping custom CSS', () => {
		expect( getResetAttributes( attributes, changed ) ).toEqual( {
			textColor: undefined,
			style: { css: 'color: red;' },
		} );
	} );
} );
