import { describe, expect, it } from 'vitest';
import {
	getResetAttributes,
	getSourceElementName,
	getSourceLabel,
	getStyleSourceRows,
	isColorPath,
} from '../style-sources';

const context = {
	path: [ 'color', 'text' ],
	blockTitle: 'Button',
	variationTitle: 'Outline',
	elementName: 'button',
};

const getLabel = ( path ) => path.join( '.' );
const getSource = ( source ) => source.layer;

describe( 'getSourceLabel', () => {
	it( 'names the site section for the root layer', () => {
		expect(
			getSourceLabel(
				{ layer: 'root' },
				{ ...context, path: [ 'typography', 'fontSize' ] }
			)
		).toBe( 'Site typography' );
	} );

	it( 'reads root element styles as their property section', () => {
		expect(
			getSourceLabel(
				{ layer: 'root' },
				{ ...context, path: [ 'elements', 'link', 'color', 'text' ] }
			)
		).toBe( 'Site colors' );
	} );

	it( 'names the element, block and variation layers', () => {
		expect( getSourceLabel( { layer: 'element' }, context ) ).toBe(
			'Button element'
		);
		expect( getSourceLabel( { layer: 'block' }, context ) ).toBe(
			'Button block'
		);
		expect( getSourceLabel( { layer: 'blockVariation' }, context ) ).toBe(
			'Outline style'
		);
	} );

	it( 'returns null for anything the engine did not resolve', () => {
		expect( getSourceLabel( undefined, context ) ).toBeNull();
		expect( getSourceLabel( { layer: 'theme' }, context ) ).toBeNull();
		expect(
			getSourceLabel(
				{ layer: 'element' },
				{ ...context, elementName: undefined }
			)
		).toBeNull();
		expect(
			getSourceLabel(
				{ layer: 'blockVariation' },
				{ ...context, variationTitle: undefined }
			)
		).toBeNull();
	} );
} );

describe( 'getSourceElementName', () => {
	it( 'returns the only element layer', () => {
		expect(
			getSourceElementName( [ 'color', 'text' ], [ 'button' ], {} )
		).toBe( 'button' );
	} );

	it( 'returns the highest precedence element that sets the leaf', () => {
		const elementStyles = {
			heading: { color: { text: 'red' } },
			h2: { color: { text: 'blue' } },
		};
		expect(
			getSourceElementName(
				[ 'color', 'text' ],
				[ 'heading', 'h2' ],
				elementStyles
			)
		).toBe( 'h2' );
		expect(
			getSourceElementName(
				[ 'typography', 'fontSize' ],
				[ 'heading', 'h2' ],
				{ heading: { typography: { fontSize: '2rem' } } }
			)
		).toBe( 'heading' );
	} );
} );

describe( 'getStyleSourceRows', () => {
	const resolved = {
		value: {
			color: { text: 'var:preset|color|accent' },
			typography: { fontSize: '14px', lineHeight: '1.4' },
			spacing: { padding: { top: '12px', bottom: '12px' } },
		},
		sources: {
			'color.text': { layer: 'blockVariation' },
			'typography.fontSize': { layer: 'block' },
			'typography.lineHeight': { layer: 'root' },
			'spacing.padding.top': { layer: 'block' },
			'spacing.padding.bottom': { layer: 'block' },
		},
	};
	const stylePaths = [
		[ 'color', 'text' ],
		[ 'color', 'background' ],
		[ 'typography', 'fontSize' ],
		[ 'typography', 'lineHeight' ],
		[ 'typography', 'letterSpacing' ],
		[ 'spacing', 'padding' ],
	];

	const getRows = ( attributes ) =>
		getStyleSourceRows( {
			stylePaths,
			attributes,
			resolved,
			getLabel,
			getSource,
		} );

	it( 'lists inherited styles with their source', () => {
		const rows = getRows( {} );
		expect( rows.map( ( row ) => row.id ) ).toEqual( [
			'color.text',
			'typography.fontSize',
			'typography.lineHeight',
			'spacing.padding',
		] );
		expect( rows[ 0 ] ).toMatchObject( {
			isChanged: false,
			value: 'var:preset|color|accent',
			source: 'blockVariation',
			replaces: null,
		} );
		expect( rows[ 3 ].source ).toBe( 'block' );
	} );

	it( 'marks a local style as replacing what it overrides', () => {
		const [ row ] = getRows( {
			style: { typography: { fontSize: '20px' } },
		} ).filter( ( { isChanged } ) => isChanged );
		expect( row ).toMatchObject( {
			id: 'typography.fontSize',
			value: '20px',
			source: null,
			replaces: { value: '14px', source: 'block' },
		} );
	} );

	it( 'keeps a local style that overrides nothing', () => {
		const [ row ] = getRows( {
			style: { typography: { letterSpacing: '1px' } },
		} ).filter( ( { isChanged } ) => isChanged );
		expect( row ).toMatchObject( {
			id: 'typography.letterSpacing',
			isChanged: true,
			value: '1px',
			replaces: null,
		} );
	} );

	it( 'reads preset attributes as local values', () => {
		const row = getRows( { textColor: 'vivid-red' } ).find(
			( { id } ) => id === 'color.text'
		);
		expect( row ).toMatchObject( {
			isChanged: true,
			value: 'var:preset|color|vivid-red',
			presetAttribute: 'textColor',
			replaces: {
				value: 'var:preset|color|accent',
				source: 'blockVariation',
			},
		} );
	} );

	it( 'drops inherited styles with no real value, and keeps a local one', () => {
		const rows = getStyleSourceRows( {
			stylePaths: [
				[ 'typography', 'fontFamily' ],
				[ 'typography', 'letterSpacing' ],
				[ 'typography', 'textDecoration' ],
			],
			attributes: { style: { typography: { letterSpacing: '1px' } } },
			resolved: {
				value: {
					typography: {
						fontFamily: 'inherit',
						letterSpacing: 'inherit',
						textDecoration: 'none',
					},
				},
				sources: {
					'typography.fontFamily': { layer: 'element' },
					'typography.letterSpacing': { layer: 'element' },
					'typography.textDecoration': { layer: 'element' },
				},
			},
			getLabel,
			getSource,
		} );
		expect( rows ).toHaveLength( 1 );
		expect( rows[ 0 ] ).toMatchObject( {
			id: 'typography.letterSpacing',
			isChanged: true,
			replaces: null,
		} );
	} );

	it( 'folds inherited border width, style and color into one row', () => {
		const rows = getStyleSourceRows( {
			stylePaths: [
				[ 'border', 'color' ],
				[ 'border', 'style' ],
				[ 'border', 'width' ],
				[ 'shadow' ],
				[ 'typography', 'fontWeight' ],
			],
			attributes: { style: { shadow: 'var:preset|shadow|natural' } },
			resolved: {
				value: {
					border: {
						color: 'currentColor',
						style: 'solid',
						width: '1px',
					},
					typography: { fontWeight: '600' },
				},
				sources: {
					'border.color': { layer: 'blockVariation' },
					'border.style': { layer: 'blockVariation' },
					'border.width': { layer: 'blockVariation' },
					'typography.fontWeight': { layer: 'block' },
				},
			},
			getLabel,
			getSource,
		} );
		expect( rows.map( ( row ) => row.id ) ).toEqual( [
			'typography.fontWeight',
			'border',
			'shadow',
		] );
		expect( rows[ 1 ] ).toMatchObject( {
			isChanged: false,
			value: { color: 'currentColor', style: 'solid', width: '1px' },
			source: 'blockVariation',
		} );
	} );

	it( 'keeps border rows apart when the block sets one of them', () => {
		const ids = getStyleSourceRows( {
			stylePaths: [
				[ 'border', 'color' ],
				[ 'border', 'width' ],
			],
			attributes: { style: { border: { width: '3px' } } },
			resolved: {
				value: { border: { color: 'red', width: '1px' } },
				sources: {
					'border.color': { layer: 'block' },
					'border.width': { layer: 'block' },
				},
			},
			getLabel,
			getSource,
		} ).map( ( row ) => row.id );
		expect( ids ).toEqual( [ 'border.color', 'border.width' ] );
	} );

	it( 'adds a row for a local style no control path covers', () => {
		const rows = getRows( {
			style: {
				elements: { link: { ':hover': { color: { text: 'red' } } } },
				css: 'color: red;',
			},
		} );
		const changed = rows.filter( ( { isChanged } ) => isChanged );
		expect( changed ).toHaveLength( 1 );
		expect( changed[ 0 ].id ).toBe( 'elements.link.:hover.color.text' );
	} );
} );

describe( 'getResetAttributes', () => {
	it( 'removes the reset paths and preset attributes, keeping custom CSS', () => {
		const attributes = {
			textColor: 'vivid-red',
			style: {
				typography: { fontSize: '20px', letterSpacing: '1px' },
				css: 'color: red;',
			},
		};
		expect(
			getResetAttributes( attributes, [
				{ path: [ 'color', 'text' ], presetAttribute: 'textColor' },
				{ path: [ 'typography', 'fontSize' ] },
			] )
		).toEqual( {
			textColor: undefined,
			style: {
				typography: { letterSpacing: '1px' },
				css: 'color: red;',
			},
		} );
		expect( attributes.style.typography.fontSize ).toBe( '20px' );
	} );

	it( 'clears the style attribute when nothing is left', () => {
		expect(
			getResetAttributes(
				{ style: { typography: { fontSize: '20px' } } },
				[ { path: [ 'typography', 'fontSize' ] } ]
			)
		).toEqual( { style: undefined } );
	} );
} );

describe( 'isColorPath', () => {
	it( 'matches color leaves only', () => {
		expect( isColorPath( [ 'color', 'text' ] ) ).toBe( true );
		expect( isColorPath( [ 'border', 'color' ] ) ).toBe( true );
		expect( isColorPath( [ 'color', 'gradient' ] ) ).toBe( false );
		expect( isColorPath( [ 'typography', 'fontSize' ] ) ).toBe( false );
	} );
} );
