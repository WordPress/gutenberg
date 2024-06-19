/**
 * Internal dependencies
 */
import {
	filterObjectByProperty,
	removePropertyFromObject,
} from '../use-theme-style-variations-by-property';

describe( 'filterObjectByProperty', () => {
	const noop = () => {};
	test.each( [
		{
			object: {
				foo: 'bar',
				array: [ 1, 3, 4 ],
			},
			property: 'array',
			expected: { array: [ 1, 3, 4 ] },
		},
		{
			object: {
				foo: 'bar',
			},
			property: 'does-not-exist',
			expected: {},
		},
		{
			object: {
				foo: 'bar',
			},
			property: false,
			expected: {},
		},
		{
			object: {
				dig: {
					deeper: {
						null: null,
					},
				},
			},
			property: 'null',
			expected: {
				dig: {
					deeper: {
						null: null,
					},
				},
			},
		},
		{
			object: {
				function: noop,
			},
			property: 'function',
			expected: {
				function: noop,
			},
		},
		{
			object: [],
			property: 'something',
			expected: {},
		},
		{
			object: {},
			property: undefined,
			expected: {},
		},
		{
			object: {
				'nested-object': {
					'nested-object-foo': 'bar',
					array: [ 1, 3, 4 ],
				},
			},
			property: 'nested-object-foo',
			expected: {
				'nested-object': {
					'nested-object-foo': 'bar',
				},
			},
		},
	] )(
		'should filter object by $property',
		( { expected, object, property } ) => {
			const result = filterObjectByProperty( object, property );
			expect( result ).toEqual( expected );
		}
	);
} );

describe( 'removePropertyFromObject', () => {
	const mockBaseVariation = {
		settings: {
			typography: {
				fontFamilies: {
					custom: [
						{
							name: 'ADLaM Display',
							fontFamily: 'ADLaM Display, system-ui',
							slug: 'adlam-display',
							fontFace: [
								{
									src: 'adlam.woff2',
									fontWeight: '400',
									fontStyle: 'normal',
									fontFamily: 'ADLaM Display',
								},
							],
						},
					],
				},
				fontSizes: [
					{
						name: 'Base small',
						slug: 'base-small',
						size: '1px',
					},
					{
						name: 'Base medium',
						slug: 'base-medium',
						size: '2px',
					},
					{
						name: 'Base large',
						slug: 'base-large',
						size: '3px',
					},
				],
			},
			color: {
				palette: {
					custom: [
						{
							color: '#c42727',
							name: 'Color 1',
							slug: 'custom-color-1',
						},
						{
							color: '#3b0f0f',
							name: 'Color 2',
							slug: 'custom-color-2',
						},
					],
				},
			},
			layout: {
				wideSize: '1137px',
				contentSize: '400px',
			},
		},
		styles: {
			typography: {
				fontSize: '12px',
				lineHeight: '1.5',
			},
			color: {
				backgroundColor: 'cheese',
				color: 'lettuce',
			},
			elements: {
				cite: {
					color: {
						text: 'white',
					},
					typography: {
						letterSpacing: 'white',
					},
				},
			},
			blocks: {
				'core/quote': {
					color: {
						text: 'hello',
						background: 'dolly',
					},
					typography: {
						fontSize: '111111px',
					},
				},
				'core/group': {
					typography: {
						fontFamily: 'var:preset|font-family|system-sans-serif',
					},
				},
			},
		},
	};

	it( 'should return with no property', () => {
		const object = { test: 'me' };
		expect( removePropertyFromObject( object, undefined ) ).toEqual(
			object
		);
	} );

	it( 'should return with non-string property', () => {
		const object = { test: 'you' };
		expect( removePropertyFromObject( object, true ) ).toEqual( object );
	} );

	it( 'should return with empty object', () => {
		const object = {};
		expect( removePropertyFromObject( object, 'color' ) ).toEqual( object );
	} );

	it( 'should return with null', () => {
		expect( removePropertyFromObject( null, 'color' ) ).toEqual( null );
	} );

	it( 'should remove the specified property from the object', () => {
		expect(
			removePropertyFromObject(
				{
					...mockBaseVariation,
				},
				'typography'
			)
		).toEqual( {
			settings: {
				color: {
					palette: {
						custom: [
							{
								color: '#c42727',
								name: 'Color 1',
								slug: 'custom-color-1',
							},
							{
								color: '#3b0f0f',
								name: 'Color 2',
								slug: 'custom-color-2',
							},
						],
					},
				},
				layout: {
					wideSize: '1137px',
					contentSize: '400px',
				},
			},
			styles: {
				color: {
					backgroundColor: 'cheese',
					color: 'lettuce',
				},
				elements: {
					cite: {
						color: {
							text: 'white',
						},
					},
				},
				blocks: {
					'core/quote': {
						color: {
							text: 'hello',
							background: 'dolly',
						},
					},
					'core/group': {},
				},
			},
		} );
	} );
} );
