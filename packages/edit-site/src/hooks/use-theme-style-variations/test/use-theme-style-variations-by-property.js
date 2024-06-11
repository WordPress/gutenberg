/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

/**
 * Internal dependencies
 */
import useThemeStyleVariationsByProperty, {
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

describe( 'useThemeStyleVariationsByProperty', () => {
	const mockVariations = [
		{
			title: 'Title 1',
			description: 'Description 1',
			settings: {
				color: {
					duotone: [
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
					],
					gradients: [
						{
							name: 'Vivid cyan blue to vivid purple',
							gradient:
								'linear-gradient(135deg,rgba(6,147,227,1) 0%,rgb(155,81,224) 100%)',
							slug: 'vivid-cyan-blue-to-vivid-purple',
						},
						{
							name: 'Light green cyan to vivid green cyan',
							gradient:
								'linear-gradient(135deg,rgb(122,220,180) 0%,rgb(0,208,130) 100%)',
							slug: 'light-green-cyan-to-vivid-green-cyan',
						},
						{
							name: 'Luminous vivid amber to luminous vivid orange',
							gradient:
								'linear-gradient(135deg,rgba(252,185,0,1) 0%,rgba(255,105,0,1) 100%)',
							slug: 'luminous-vivid-amber-to-luminous-vivid-orange',
						},
					],
					palette: [
						{
							name: 'Vivid red',
							slug: 'vivid-red',
							color: '#cf2e2e',
						},
						{
							name: 'Luminous vivid orange',
							slug: 'luminous-vivid-orange',
							color: '#ff6900',
						},
						{
							name: 'Luminous vivid amber',
							slug: 'luminous-vivid-amber',
							color: '#fcb900',
						},
					],
				},
				typography: {
					fluid: true,
					fontFamilies: {
						theme: [
							{
								name: 'Inter san-serif',
								fontFamily: 'Inter san-serif',
								slug: 'inter-san-serif',
								fontFace: [
									{
										src: 'inter-san-serif.woff2',
										fontWeight: '400',
										fontStyle: 'italic',
										fontFamily: 'Inter san-serif',
									},
								],
							},
						],
					},
					fontSizes: [
						{
							name: 'Small',
							slug: 'small',
							size: '13px',
						},
						{
							name: 'Medium',
							slug: 'medium',
							size: '20px',
						},
						{
							name: 'Large',
							slug: 'large',
							size: '36px',
						},
					],
				},
				layout: {
					wideSize: '1200px',
				},
			},
			styles: {
				typography: {
					letterSpacing: '3px',
				},
				color: {
					backgroundColor: 'red',
					color: 'orange',
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
							text: 'black',
							background: 'white',
						},
						typography: {
							fontSize: '20px',
						},
					},
				},
			},
		},
		{
			title: 'Title 2',
			description: 'Description 2',
			settings: {
				color: {
					duotone: [
						{
							name: 'Boom',
							colors: [ '#000000', '#7f7f7f' ],
							slug: 'boom',
						},
						{
							name: 'Gray to white',
							colors: [ '#000000', '#ffffff' ],
							slug: 'gray-to-white',
						},
						{
							name: 'Whatever to whatever',
							colors: [ '#8c00b7', '#fcff41' ],
							slug: 'whatever-to-whatever',
						},
					],
					gradients: [
						{
							name: 'Jam in the office',
							gradient:
								'linear-gradient(135deg,rgba(6,147,227,1) 0%,rgb(155,81,224) 100%)',
							slug: 'jam-in-the-office',
						},
						{
							name: 'Open source',
							gradient:
								'linear-gradient(135deg,rgb(122,220,180) 0%,rgb(0,208,130) 100%)',
							slug: 'open-source',
						},
						{
							name: 'Here to there',
							gradient:
								'linear-gradient(135deg,rgba(252,185,0,1) 0%,rgba(255,105,0,1) 100%)',
							slug: 'here-to-there',
						},
					],
					palette: [
						{
							name: 'Chunky Bacon',
							slug: 'chunky-bacon',
							color: '#cf2e2e',
						},
						{
							name: 'Burrito',
							slug: 'burrito',
							color: '#ff6900',
						},
						{
							name: 'Dinosaur',
							slug: 'dinosaur',
							color: '#fcb900',
						},
					],
				},
				typography: {
					fontSizes: [
						{
							name: 'Smallish',
							slug: 'smallish',
							size: '15px',
						},
						{
							name: 'Mediumish',
							slug: 'mediumish',
							size: '22px',
						},
						{
							name: 'Largish',
							slug: 'largish',
							size: '44px',
						},
					],
				},
				layout: {
					contentSize: '300px',
				},
			},
			styles: {
				typography: {
					letterSpacing: '3px',
				},
				color: {
					backgroundColor: 'red',
					text: 'orange',
				},
				elements: {
					link: {
						typography: {
							textDecoration: 'underline',
						},
					},
				},
				blocks: {
					'core/paragraph': {
						color: {
							text: 'purple',
							background: 'green',
						},
						typography: {
							fontSize: '20px',
						},
					},
				},
			},
		},
	];
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

	it( 'should return variations if property is falsy', () => {
		const { result } = renderHook( () =>
			useThemeStyleVariationsByProperty( {
				variations: mockVariations,
				property: '',
			} )
		);

		expect( result.current ).toEqual( mockVariations );
	} );

	it( 'should return variations if variations is empty or falsy', () => {
		const { result: emptyResult } = renderHook( () =>
			useThemeStyleVariationsByProperty( {
				variations: [],
				property: 'layout',
			} )
		);

		expect( emptyResult.current ).toEqual( [] );

		const { result: falsyResult } = renderHook( () =>
			useThemeStyleVariationsByProperty( {
				variations: null,
				property: 'layout',
			} )
		);

		expect( falsyResult.current ).toEqual( null );
	} );

	it( 'should return new, unreferenced object', () => {
		const variations = [
			{
				title: 'hey',
				description: 'ho',
				joe: {
					where: {
						you: 'going with that unit test in your hand',
					},
				},
			},
		];
		const { result } = renderHook( () =>
			useThemeStyleVariationsByProperty( {
				variations,
				property: 'where',
			} )
		);

		expect( result.current ).toEqual( [
			{
				title: 'hey',
				description: 'ho',
				joe: {
					where: {
						you: 'going with that unit test in your hand',
					},
				},
			},
		] );

		expect( result.current[ 0 ].joe.where ).not.toBe(
			variations[ 0 ].joe.where
		);
		expect( result.current[ 0 ].joe ).not.toBe( variations[ 0 ].joe );
	} );

	it( "should return the variation's typography properties", () => {
		const { result } = renderHook( () =>
			useThemeStyleVariationsByProperty( {
				variations: mockVariations,
				property: 'typography',
			} )
		);

		expect( result.current ).toEqual( [
			{
				title: 'Title 1',
				description: 'Description 1',
				settings: {
					typography: {
						fluid: true,
						fontFamilies: {
							theme: [
								{
									name: 'Inter san-serif',
									fontFamily: 'Inter san-serif',
									slug: 'inter-san-serif',
									fontFace: [
										{
											src: 'inter-san-serif.woff2',
											fontWeight: '400',
											fontStyle: 'italic',
											fontFamily: 'Inter san-serif',
										},
									],
								},
							],
						},
						fontSizes: [
							{
								name: 'Small',
								slug: 'small',
								size: '13px',
							},
							{
								name: 'Medium',
								slug: 'medium',
								size: '20px',
							},
							{
								name: 'Large',
								slug: 'large',
								size: '36px',
							},
						],
					},
				},
				styles: {
					typography: {
						letterSpacing: '3px',
					},
					blocks: {
						'core/quote': {
							typography: {
								fontSize: '20px',
							},
						},
					},
				},
			},
			{
				title: 'Title 2',
				description: 'Description 2',
				settings: {
					typography: {
						fontSizes: [
							{
								name: 'Smallish',
								slug: 'smallish',
								size: '15px',
							},
							{
								name: 'Mediumish',
								slug: 'mediumish',
								size: '22px',
							},
							{
								name: 'Largish',
								slug: 'largish',
								size: '44px',
							},
						],
					},
				},
				styles: {
					typography: {
						letterSpacing: '3px',
					},
					elements: {
						link: {
							typography: {
								textDecoration: 'underline',
							},
						},
					},
					blocks: {
						'core/paragraph': {
							typography: {
								fontSize: '20px',
							},
						},
					},
				},
			},
		] );
	} );

	it( "should return the variation's color properties", () => {
		const { result } = renderHook( () =>
			useThemeStyleVariationsByProperty( {
				variations: mockVariations,
				property: 'color',
			} )
		);

		expect( result.current ).toEqual( [
			{
				title: 'Title 1',
				description: 'Description 1',
				settings: {
					color: {
						duotone: [
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
						],
						gradients: [
							{
								name: 'Vivid cyan blue to vivid purple',
								gradient:
									'linear-gradient(135deg,rgba(6,147,227,1) 0%,rgb(155,81,224) 100%)',
								slug: 'vivid-cyan-blue-to-vivid-purple',
							},
							{
								name: 'Light green cyan to vivid green cyan',
								gradient:
									'linear-gradient(135deg,rgb(122,220,180) 0%,rgb(0,208,130) 100%)',
								slug: 'light-green-cyan-to-vivid-green-cyan',
							},
							{
								name: 'Luminous vivid amber to luminous vivid orange',
								gradient:
									'linear-gradient(135deg,rgba(252,185,0,1) 0%,rgba(255,105,0,1) 100%)',
								slug: 'luminous-vivid-amber-to-luminous-vivid-orange',
							},
						],
						palette: [
							{
								name: 'Vivid red',
								slug: 'vivid-red',
								color: '#cf2e2e',
							},
							{
								name: 'Luminous vivid orange',
								slug: 'luminous-vivid-orange',
								color: '#ff6900',
							},
							{
								name: 'Luminous vivid amber',
								slug: 'luminous-vivid-amber',
								color: '#fcb900',
							},
						],
					},
				},
				styles: {
					color: {
						backgroundColor: 'red',
						color: 'orange',
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
								text: 'black',
								background: 'white',
							},
						},
					},
				},
			},
			{
				title: 'Title 2',
				description: 'Description 2',
				settings: {
					color: {
						duotone: [
							{
								name: 'Boom',
								colors: [ '#000000', '#7f7f7f' ],
								slug: 'boom',
							},
							{
								name: 'Gray to white',
								colors: [ '#000000', '#ffffff' ],
								slug: 'gray-to-white',
							},
							{
								name: 'Whatever to whatever',
								colors: [ '#8c00b7', '#fcff41' ],
								slug: 'whatever-to-whatever',
							},
						],
						gradients: [
							{
								name: 'Jam in the office',
								gradient:
									'linear-gradient(135deg,rgba(6,147,227,1) 0%,rgb(155,81,224) 100%)',
								slug: 'jam-in-the-office',
							},
							{
								name: 'Open source',
								gradient:
									'linear-gradient(135deg,rgb(122,220,180) 0%,rgb(0,208,130) 100%)',
								slug: 'open-source',
							},
							{
								name: 'Here to there',
								gradient:
									'linear-gradient(135deg,rgba(252,185,0,1) 0%,rgba(255,105,0,1) 100%)',
								slug: 'here-to-there',
							},
						],
						palette: [
							{
								name: 'Chunky Bacon',
								slug: 'chunky-bacon',
								color: '#cf2e2e',
							},
							{
								name: 'Burrito',
								slug: 'burrito',
								color: '#ff6900',
							},
							{
								name: 'Dinosaur',
								slug: 'dinosaur',
								color: '#fcb900',
							},
						],
					},
				},
				styles: {
					color: {
						backgroundColor: 'red',
						text: 'orange',
					},
					blocks: {
						'core/paragraph': {
							color: {
								text: 'purple',
								background: 'green',
							},
						},
					},
				},
			},
		] );
	} );

	it( 'should merge the user styles and settings with the supplied variation, but only for the specified property', () => {
		const { result } = renderHook( () =>
			useThemeStyleVariationsByProperty( {
				variations: [ mockVariations[ 0 ] ],
				property: 'typography',
				baseVariation: mockBaseVariation,
			} )
		);

		expect( result.current ).toEqual( [
			{
				title: 'Title 1',
				description: 'Description 1',
				settings: {
					typography: {
						fluid: true,
						fontFamilies: {
							theme: [
								{
									name: 'Inter san-serif',
									fontFamily: 'Inter san-serif',
									slug: 'inter-san-serif',
									fontFace: [
										{
											src: 'inter-san-serif.woff2',
											fontWeight: '400',
											fontStyle: 'italic',
											fontFamily: 'Inter san-serif',
										},
									],
								},
							],
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
								name: 'Small',
								slug: 'small',
								size: '13px',
							},
							{
								name: 'Medium',
								slug: 'medium',
								size: '20px',
							},
							{
								name: 'Large',
								slug: 'large',
								size: '36px',
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
					color: {
						backgroundColor: 'cheese',
						color: 'lettuce',
					},
					typography: {
						fontSize: '12px',
						letterSpacing: '3px',
						lineHeight: '1.5',
					},
					blocks: {
						'core/quote': {
							color: {
								text: 'hello',
								background: 'dolly',
							},
							typography: {
								fontSize: '20px',
							},
						},
						'core/group': {
							typography: {
								fontFamily:
									'var:preset|font-family|system-sans-serif',
							},
						},
					},
				},
			},
		] );
	} );

	it( 'should filter the output and return only variations that match filter', () => {
		const { result } = renderHook( () =>
			useThemeStyleVariationsByProperty( {
				variations: mockVariations,
				property: 'typography',
				filter: ( variation ) =>
					!! variation?.settings?.typography?.fontFamilies?.theme
						?.length,
			} )
		);
		expect( result.current ).toEqual( [
			{
				title: 'Title 1',
				description: 'Description 1',
				settings: {
					typography: {
						fluid: true,
						fontFamilies: {
							theme: [
								{
									name: 'Inter san-serif',
									fontFamily: 'Inter san-serif',
									slug: 'inter-san-serif',
									fontFace: [
										{
											src: 'inter-san-serif.woff2',
											fontWeight: '400',
											fontStyle: 'italic',
											fontFamily: 'Inter san-serif',
										},
									],
								},
							],
						},
						fontSizes: [
							{
								name: 'Small',
								slug: 'small',
								size: '13px',
							},
							{
								name: 'Medium',
								slug: 'medium',
								size: '20px',
							},
							{
								name: 'Large',
								slug: 'large',
								size: '36px',
							},
						],
					},
				},
				styles: {
					typography: {
						letterSpacing: '3px',
					},
					blocks: {
						'core/quote': {
							typography: {
								fontSize: '20px',
							},
						},
					},
				},
			},
		] );
	} );
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
