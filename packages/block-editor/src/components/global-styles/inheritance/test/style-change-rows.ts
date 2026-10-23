import { describe, expect, it } from 'vitest';
import {
	getLocalStyle,
	getResetAttributes,
	getStyleChangeRows,
} from '../style-change-rows';
import type { StyleChangeRow, StyleSource } from '../style-change-rows';

const describeSource = ( source: StyleSource ) => `${ source.layer } source`;

const PATHS = [
	{ path: [ 'color', 'text' ], isSupported: true },
	{ path: [ 'color', 'background' ], isSupported: true },
	{ path: [ 'typography', 'fontSize' ], isSupported: true },
	{ path: [ 'spacing', 'padding' ], isSupported: true },
	{ path: [ 'typography', 'lineHeight' ], isSupported: false },
];

describe( 'getLocalStyle', () => {
	it( 'folds preset attributes into the style values', () => {
		expect(
			getLocalStyle( {
				textColor: 'vivid-red',
				style: { typography: { fontSize: '20px' } },
			} )
		).toEqual( {
			color: { text: 'var:preset|color|vivid-red' },
			typography: { fontSize: '20px' },
		} );
	} );
} );

describe( 'getStyleChangeRows', () => {
	it( 'lists a local value that overrides nothing', () => {
		const rows = getStyleChangeRows( {
			paths: PATHS,
			localStyle: { color: { background: '#fff' } },
			sources: {},
			describeSource,
		} );
		expect( rows ).toEqual( [
			expect.objectContaining( {
				key: 'color.background',
				label: 'Background color',
				status: 'local',
				sourceLabel: null,
			} ),
		] );
	} );

	it( 'does not count empty values as set on the block', () => {
		const rows = getStyleChangeRows( {
			paths: PATHS,
			localStyle: { color: { text: '' }, spacing: { padding: {} } },
			sources: {},
			describeSource,
		} );
		expect( rows ).toEqual( [] );
	} );

	it( 'marks a local value over an inherited one as an override', () => {
		const rows = getStyleChangeRows( {
			paths: PATHS,
			localStyle: { color: { text: '#000' } },
			inheritedStyle: { color: { text: '#111' } },
			sources: { 'color.text': { layer: 'block' } },
			describeSource,
		} );
		expect( rows ).toEqual( [
			expect.objectContaining( {
				key: 'color.text',
				status: 'override',
				sourceLabel: 'block source',
				value: '#000',
				inheritedValue: '#111',
			} ),
		] );
	} );

	it( 'carries the inherited value on an inherited row', () => {
		const rows = getStyleChangeRows( {
			paths: PATHS,
			localStyle: {},
			inheritedStyle: { typography: { fontSize: '18px' } },
			sources: { 'typography.fontSize': { layer: 'root' } },
			describeSource,
		} );
		expect( rows ).toEqual( [
			expect.objectContaining( {
				key: 'typography.fontSize',
				status: 'inherited',
				value: '18px',
			} ),
		] );
	} );

	it( 'lists inherited values after local ones', () => {
		const rows = getStyleChangeRows( {
			paths: PATHS,
			localStyle: { spacing: { padding: { top: '1px' } } },
			inheritedStyle: { typography: { fontSize: '18px' } },
			sources: { 'typography.fontSize': { layer: 'root' } },
			describeSource,
		} );
		expect( rows.map( ( row ) => [ row.key, row.status ] ) ).toEqual( [
			[ 'spacing.padding', 'local' ],
			[ 'typography.fontSize', 'inherited' ],
		] );
	} );

	it( 'uses the highest precedence layer for a composite value', () => {
		const rows = getStyleChangeRows( {
			paths: PATHS,
			localStyle: {},
			inheritedStyle: {
				spacing: { padding: { top: '1px', left: '2px' } },
			},
			sources: {
				'spacing.padding.top': { layer: 'block' },
				'spacing.padding.left': { layer: 'blockVariation' },
			},
			describeSource,
		} );
		expect( rows ).toEqual( [
			expect.objectContaining( {
				key: 'spacing.padding',
				sourceLabel: 'blockVariation source',
			} ),
		] );
	} );

	it( 'leaves out an inherited value whose source cannot be named', () => {
		const rows = getStyleChangeRows( {
			paths: PATHS,
			localStyle: { color: { text: '#000' } },
			sources: {
				'color.text': { layer: 'element' },
				'typography.fontSize': { layer: 'element' },
			},
			describeSource: () => null,
		} );
		expect( rows ).toEqual( [
			expect.objectContaining( {
				key: 'color.text',
				status: 'local',
				sourceLabel: null,
			} ),
		] );
	} );

	it( 'skips inherited values for unsupported controls but keeps local ones', () => {
		const rows = getStyleChangeRows( {
			paths: PATHS,
			localStyle: {},
			sources: { 'typography.lineHeight': { layer: 'root' } },
			describeSource,
		} );
		expect( rows ).toEqual( [] );

		const localRows = getStyleChangeRows( {
			paths: PATHS,
			localStyle: { typography: { lineHeight: '2' } },
			sources: {},
			describeSource,
		} );
		expect( localRows ).toEqual( [
			expect.objectContaining( {
				key: 'typography.lineHeight',
				status: 'local',
			} ),
		] );
	} );

	it( 'leaves out inherited values that only hand the value on', () => {
		const rows = getStyleChangeRows( {
			paths: PATHS,
			localStyle: {},
			inheritedStyle: {
				color: { text: 'inherit', gradient: 'transparent none' },
				typography: { fontSize: 'none' },
			},
			sources: {
				'color.text': { layer: 'element' },
				'typography.fontSize': { layer: 'element' },
			},
			describeSource,
		} );
		expect( rows ).toEqual( [] );
	} );

	it( 'treats a local value over an inherit keyword as replacing nothing', () => {
		const rows = getStyleChangeRows( {
			paths: PATHS,
			localStyle: { typography: { fontSize: '22px' } },
			inheritedStyle: { typography: { fontSize: 'inherit' } },
			sources: { 'typography.fontSize': { layer: 'element' } },
			describeSource,
		} );
		expect( rows ).toEqual( [
			expect.objectContaining( {
				key: 'typography.fontSize',
				status: 'local',
				sourceLabel: null,
			} ),
		] );
	} );

	it( 'lists each group in inspector order', () => {
		const rows = getStyleChangeRows( {
			paths: [
				{ path: [ 'shadow' ], isSupported: true },
				{ path: [ 'color', 'background' ], isSupported: true },
				{ path: [ 'typography', 'fontSize' ], isSupported: true },
				{ path: [ 'color', 'text' ], isSupported: true },
			],
			localStyle: { shadow: 'natural', color: { text: '#000' } },
			inheritedStyle: {
				color: { background: '#fff' },
				typography: { fontSize: '18px' },
			},
			sources: {
				'color.background': { layer: 'element' },
				'typography.fontSize': { layer: 'element' },
			},
			describeSource,
		} );
		expect( rows.map( ( row ) => row.key ) ).toEqual( [
			'color.text',
			'shadow',
			'typography.fontSize',
			'color.background',
		] );
	} );

	it( 'folds border parts from one source into a Border row', () => {
		const border = { width: '1px', style: 'solid', color: 'currentColor' };
		const rows = getStyleChangeRows( {
			paths: [ 'width', 'style', 'color' ].map( ( part ) => ( {
				path: [ 'border', part ],
				isSupported: true,
			} ) ),
			localStyle: {},
			inheritedStyle: { border },
			sources: {
				'border.width': { layer: 'blockVariation' },
				'border.style': { layer: 'blockVariation' },
				'border.color': { layer: 'blockVariation' },
			},
			describeSource,
		} );
		expect( rows ).toEqual( [
			expect.objectContaining( {
				key: 'border',
				label: 'Border',
				status: 'inherited',
				sourceLabel: 'blockVariation source',
				value: border,
			} ),
		] );
	} );

	it( 'keeps border parts apart when their sources differ', () => {
		const rows = getStyleChangeRows( {
			paths: [ 'width', 'color' ].map( ( part ) => ( {
				path: [ 'border', part ],
				isSupported: true,
			} ) ),
			localStyle: {},
			inheritedStyle: { border: { width: '1px', color: '#000' } },
			sources: {
				'border.width': { layer: 'blockVariation' },
				'border.color': { layer: 'block' },
			},
			describeSource,
		} );
		expect( rows.map( ( row ) => row.key ) ).toEqual( [
			'border.color',
			'border.width',
		] );
	} );
} );

describe( 'getResetAttributes', () => {
	const row = ( path: string[] ): StyleChangeRow => ( {
		key: path.join( '.' ),
		path,
		label: path.join( '.' ),
		status: 'local',
		sourceLabel: null,
		value: undefined,
	} );

	it( 'clears one style and keeps the rest', () => {
		expect(
			getResetAttributes(
				{
					style: {
						color: { text: '#c0f', background: '#fff' },
						css: 'color: red;',
					},
				},
				[ row( [ 'color', 'text' ] ) ]
			)
		).toEqual( {
			style: { color: { background: '#fff' }, css: 'color: red;' },
		} );
	} );

	it( 'clears the preset attribute that sets the style', () => {
		expect(
			getResetAttributes( { textColor: 'vivid-red' }, [
				row( [ 'color', 'text' ] ),
			] )
		).toEqual( { textColor: undefined, style: undefined } );
	} );

	it( 'clears every part of a folded Border row', () => {
		expect(
			getResetAttributes(
				{
					borderColor: 'accent-1',
					style: {
						border: { width: '1px', style: 'solid', radius: '4px' },
					},
				},
				[ row( [ 'border' ] ) ]
			)
		).toEqual( {
			borderColor: undefined,
			style: { border: { radius: '4px' } },
		} );
	} );

	it( 'resets several rows at once', () => {
		expect(
			getResetAttributes(
				{
					fontSize: 'large',
					style: { spacing: { padding: { top: '1rem' } } },
				},
				[
					row( [ 'typography', 'fontSize' ] ),
					row( [ 'spacing', 'padding' ] ),
				]
			)
		).toEqual( { fontSize: undefined, style: undefined } );
	} );
} );
