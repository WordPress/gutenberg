/**
 * Internal dependencies
 */
import { getChangesToPush, getStylesUpdate } from '../index';

describe( 'getChangesToPush', () => {
	it( 'groups an all-sides border into a single shorthand row', () => {
		const rows = getChangesToPush(
			[ 'borderColor' ],
			{ style: { border: { color: '#ff0000' } } },
			undefined
		);

		expect( rows ).toHaveLength( 1 );

		const [ row ] = rows;
		expect( row.id ).toBe( 'border' );
		expect( row.primaryPath ).toEqual( [ 'border' ] );
		expect( row.format ).toBe( 'border' );
		expect( row.newValue ).toEqual( {
			color: '#ff0000',
			width: undefined,
			style: 'solid',
		} );

		// All-sides value + four per-side values + four `solid` fallbacks.
		expect( row.paths ).toHaveLength( 9 );
		expect( row.paths ).toContainEqual( {
			path: [ 'border', 'color' ],
			value: '#ff0000',
		} );
		expect( row.paths ).toContainEqual( {
			path: [ 'border', 'top', 'color' ],
			value: '#ff0000',
		} );
		expect( row.paths ).toContainEqual( {
			path: [ 'border', 'left', 'style' ],
			value: 'solid',
		} );
	} );

	it( 'groups a per-side border into its own shorthand row', () => {
		const rows = getChangesToPush(
			[ 'borderColor', 'borderWidth', 'borderStyle' ],
			{
				style: {
					border: {
						left: {
							color: '#000fff',
							width: '2px',
							style: 'dashed',
						},
					},
				},
			},
			undefined
		);

		expect( rows ).toHaveLength( 1 );

		const [ row ] = rows;
		expect( row.id ).toBe( 'border.left' );
		expect( row.primaryPath ).toEqual( [ 'border', 'left' ] );
		expect( row.format ).toBe( 'border' );
		expect( row.newValue ).toEqual( {
			color: '#000fff',
			width: '2px',
			style: 'dashed',
		} );

		// A per-side row writes only that side, not the all-sides value.
		expect( row.paths ).toEqual( [
			{ path: [ 'border', 'left', 'color' ], value: '#000fff' },
			{ path: [ 'border', 'left', 'width' ], value: '2px' },
			{ path: [ 'border', 'left', 'style' ], value: 'dashed' },
		] );
	} );

	it( 'adds a solid style fallback for a per-side border without a style', () => {
		const rows = getChangesToPush(
			[ 'borderColor' ],
			{ style: { border: { top: { color: '#00ff00' } } } },
			undefined
		);

		expect( rows ).toHaveLength( 1 );

		const [ row ] = rows;
		expect( row.id ).toBe( 'border.top' );
		expect( row.newValue.style ).toBe( 'solid' );
		expect( row.paths ).toEqual( [
			{ path: [ 'border', 'top', 'color' ], value: '#00ff00' },
			{ path: [ 'border', 'top', 'style' ], value: 'solid' },
		] );
	} );

	it( 'does not override a border style already set in Global Styles', () => {
		const rows = getChangesToPush(
			[ 'borderColor' ],
			{ style: { border: { color: '#ff0000' } } },
			{ border: { top: { style: 'dotted' } } }
		);

		const [ row ] = rows;
		// The top side keeps its dotted style (no `solid` fallback); the other
		// three sides still get the fallback.
		expect( row.paths ).not.toContainEqual( {
			path: [ 'border', 'top', 'style' ],
			value: 'solid',
		} );
		expect( row.paths ).toContainEqual( {
			path: [ 'border', 'right', 'style' ],
			value: 'solid',
		} );
	} );

	it( 'keeps a uniform Global Styles border style as the new value', () => {
		const rows = getChangesToPush(
			[ 'borderColor' ],
			{ style: { border: { color: '#ff9900' } } },
			{
				border: {
					top: { style: 'dotted' },
					right: { style: 'dotted' },
					bottom: { style: 'dotted' },
					left: { style: 'dotted' },
				},
			}
		);

		const [ row ] = rows;
		// Every side already has `dotted` in Global Styles, so the border keeps
		// it after Apply instead of falling back to `solid`.
		expect( row.newValue.style ).toBe( 'dotted' );
		expect( row.paths ).not.toContainEqual(
			expect.objectContaining( { value: 'solid' } )
		);
	} );

	it( 'emits a border radius row with the raw value', () => {
		const radius = {
			topLeft: '1px',
			topRight: '20px',
			bottomRight: '1px',
			bottomLeft: '15px',
		};
		const rows = getChangesToPush(
			[ 'borderRadius' ],
			{ style: { border: { radius } } },
			undefined
		);

		expect( rows ).toEqual( [
			{
				id: 'border.radius',
				primaryPath: [ 'border', 'radius' ],
				paths: [ { path: [ 'border', 'radius' ], value: radius } ],
				presetAttributes: [],
				newValue: radius,
				format: 'borderRadius',
			},
		] );
	} );

	it( 'tracks the preset attribute for a preset border color', () => {
		const rows = getChangesToPush(
			[ 'borderColor' ],
			{ borderColor: 'vivid-red', style: {} },
			undefined
		);

		expect( rows ).toHaveLength( 1 );

		const [ row ] = rows;
		expect( row.id ).toBe( 'border' );
		expect( row.presetAttributes ).toEqual( [ 'borderColor' ] );
		expect( row.newValue.color ).toBe( 'var:preset|color|vivid-red' );
		expect( row.paths ).toContainEqual( {
			path: [ 'border', 'color' ],
			value: 'var:preset|color|vivid-red',
		} );
	} );

	it( 'emits one row per simple style change', () => {
		const rows = getChangesToPush(
			[ 'textTransform' ],
			{ style: { typography: { textTransform: 'uppercase' } } },
			undefined
		);

		expect( rows ).toEqual( [
			{
				id: 'typography.textTransform',
				primaryPath: [ 'typography', 'textTransform' ],
				paths: [
					{
						path: [ 'typography', 'textTransform' ],
						value: 'uppercase',
					},
				],
				presetAttributes: [],
				newValue: 'uppercase',
			},
		] );
	} );

	it( 'ignores supports without a set value', () => {
		expect(
			getChangesToPush( [ 'textTransform' ], { style: {} }, undefined )
		).toEqual( [] );
	} );

	it( 'emits a single spacing row tagged for shorthand formatting', () => {
		const padding = {
			top: '10px',
			right: '20px',
			bottom: '10px',
			left: '20px',
		};
		const rows = getChangesToPush(
			[ 'padding' ],
			{ style: { spacing: { padding } } },
			undefined
		);

		expect( rows ).toEqual( [
			{
				id: 'spacing.padding',
				primaryPath: [ 'spacing', 'padding' ],
				paths: [ { path: [ 'spacing', 'padding' ], value: padding } ],
				presetAttributes: [],
				newValue: padding,
				format: 'spacing',
			},
		] );
	} );

	it( 'skips root-only style properties that duplicate padding', () => {
		const padding = { top: '10px', bottom: '10px' };
		const rows = getChangesToPush(
			// Both keys map to `spacing.padding`, so the root-only one is
			// skipped to avoid listing padding twice.
			[ 'padding', '--wp--style--root--padding' ],
			{ style: { spacing: { padding } } },
			undefined
		);

		expect( rows ).toHaveLength( 1 );
		expect( rows[ 0 ].id ).toBe( 'spacing.padding' );
	} );

	it( 'tracks preset attributes for preset-backed changes', () => {
		const rows = getChangesToPush(
			[ 'backgroundColor' ],
			{ backgroundColor: 'vivid-red', style: {} },
			undefined
		);

		expect( rows ).toHaveLength( 1 );
		expect( rows[ 0 ].newValue ).toBe( 'var:preset|color|vivid-red' );
		expect( rows[ 0 ].presetAttributes ).toEqual( [ 'backgroundColor' ] );
	} );
} );

describe( 'getStylesUpdate', () => {
	it( 'returns null when there is nothing to push', () => {
		expect(
			getStylesUpdate( {
				rowsToPush: [],
				attributes: { style: {} },
				userConfig: {},
				name: 'core/heading',
			} )
		).toBeNull();

		expect(
			getStylesUpdate( {
				rowsToPush: [ { paths: [], presetAttributes: [] } ],
				attributes: { style: {} },
				userConfig: {},
				name: 'core/heading',
			} )
		).toBeNull();
	} );

	it( 'clears the pushed style from the block and writes it to Global Styles', () => {
		const update = getStylesUpdate( {
			rowsToPush: [
				{
					paths: [
						{
							path: [ 'typography', 'textTransform' ],
							value: 'uppercase',
						},
					],
					presetAttributes: [],
				},
			],
			attributes: {
				style: { typography: { textTransform: 'uppercase' } },
			},
			userConfig: {},
			name: 'core/heading',
		} );

		expect( update.newBlockAttributes.style ).toBeUndefined();
		expect(
			update.newUserConfig.styles.blocks[ 'core/heading' ].typography
				.textTransform
		).toBe( 'uppercase' );
	} );

	it( 'only clears preset attributes belonging to the pushed rows', () => {
		const update = getStylesUpdate( {
			rowsToPush: [
				{
					paths: [
						{
							path: [ 'color', 'background' ],
							value: 'var:preset|color|vivid-red',
						},
					],
					presetAttributes: [ 'backgroundColor' ],
				},
			],
			attributes: {
				backgroundColor: 'vivid-red',
				textColor: 'black',
				style: {},
			},
			userConfig: {},
			name: 'core/heading',
		} );

		// The pushed preset attribute is cleared from the block.
		expect( update.newBlockAttributes.backgroundColor ).toBeUndefined();
		// The unselected preset attribute is left alone.
		expect( update.newBlockAttributes ).not.toHaveProperty( 'textColor' );
		expect(
			update.newUserConfig.styles.blocks[ 'core/heading' ].color
				.background
		).toBe( 'var:preset|color|vivid-red' );
	} );
} );
