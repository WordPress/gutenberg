/**
 * Internal dependencies
 */
import { getPresetVariableFromValue } from '../style-variable-resolution';

describe( 'getPresetVariableFromValue', () => {
	it( 'returns the block preset variable when the value matches both the global & block presets', () => {
		const presetPropertyValue = '#ff0000';
		const features = {
			color: {
				palette: {
					core: [
						{
							name: 'Red vintage',
							slug: 'red-vintage',
							color: presetPropertyValue,
						},
					],
					theme: [],
					user: [],
				},
			},
			blocks: {
				'core/paragraph': {
					color: {
						palette: {
							core: [
								{
									name: 'red',
									slug: 'red',
									color: presetPropertyValue,
								},
							],
							theme: [],
							user: [],
						},
					},
				},
			},
		};
		const blockName = 'core/paragraph';
		const presetPropertyName = 'color';
		const result = getPresetVariableFromValue(
			features,
			blockName,
			presetPropertyName,
			presetPropertyValue
		);
		expect( result ).toBe( 'var:preset|color|red' );
	} );

	it( 'returns the global preset variable when the value matches only the global preset', () => {
		const presetPropertyValue = '#990F02';
		const features = {
			color: {
				palette: {
					core: [
						{
							name: 'Red cherry',
							slug: 'red-cherry',
							color: presetPropertyValue,
						},
					],
					theme: [],
					user: [],
				},
			},
			blocks: {
				'core/paragraph': {
					color: {
						palette: {
							core: [
								{ name: 'red', slug: 'red', color: '#ff0000' },
							],
							theme: [],
							user: [],
						},
					},
				},
			},
		};
		const blockName = 'core/paragraph';
		const presetPropertyName = 'color';
		const result = getPresetVariableFromValue(
			features,
			blockName,
			presetPropertyName,
			presetPropertyValue
		);
		expect( result ).toBe( 'var:preset|color|red-cherry' );
	} );

	it( 'returns the block preset variable when the value matches only the block preset', () => {
		const presetPropertyValue = '#ff0000';
		const features = {
			color: {
				palette: {
					core: [
						{
							name: 'Red cherry',
							slug: 'red-cherry',
							color: '#990F02',
						},
					],
					theme: [],
					user: [],
				},
			},
			blocks: {
				'core/paragraph': {
					color: {
						palette: {
							core: [
								{
									name: 'red',
									slug: 'red',
									color: presetPropertyValue,
								},
							],
							theme: [],
							user: [],
						},
					},
				},
			},
		};
		const blockName = 'core/paragraph';
		const presetPropertyName = 'color';
		const result = getPresetVariableFromValue(
			features,
			blockName,
			presetPropertyName,
			presetPropertyValue
		);
		expect( result ).toBe( 'var:preset|color|red' );
	} );

	it( 'returns the user-provided preset variable when the value matches in core, theme, and user presets', () => {
		const presetPropertyValue = '#990F02';
		const features = {
			color: {
				palette: {
					core: [],
					theme: [],
					user: [],
				},
			},
			blocks: {
				'core/paragraph': {
					color: {
						palette: {
							core: [
								{
									slug: 'red-cherry',
									color: presetPropertyValue,
								},
							],
							theme: [
								{
									slug: 'red-vintage',
									color: presetPropertyValue,
								},
							],
							user: [
								{ slug: 'red', color: presetPropertyValue },
							],
						},
					},
				},
			},
		};
		const blockName = 'core/paragraph';
		const presetPropertyName = 'color';
		const result = getPresetVariableFromValue(
			features,
			blockName,
			presetPropertyName,
			presetPropertyValue
		);
		expect( result ).toBe( 'var:preset|color|red' );
	} );

	it( 'returns the user-provided preset variable when the value matches only the user preset', () => {
		const presetPropertyValue = '#990F02';
		const features = {
			color: {
				palette: {
					core: [],
					theme: [],
					user: [],
				},
			},
			blocks: {
				'core/paragraph': {
					color: {
						palette: {
							core: [
								{
									slug: 'red-cherry',
									color: '#ff0000',
								},
							],
							theme: [
								{
									slug: 'red-vintage',
									color: '#ff0000',
								},
							],
							user: [
								{ slug: 'red', color: presetPropertyValue },
							],
						},
					},
				},
			},
		};
		const blockName = 'core/paragraph';
		const presetPropertyName = 'color';
		const result = getPresetVariableFromValue(
			features,
			blockName,
			presetPropertyName,
			presetPropertyValue
		);
		expect( result ).toBe( 'var:preset|color|red' );
	} );

	it( 'returns the theme-provided preset variable when the value matches both core & theme presets', () => {
		const presetPropertyValue = '#990F02';
		const features = {
			color: {
				palette: {
					core: [],
					theme: [],
					user: [],
				},
			},
			blocks: {
				'core/paragraph': {
					color: {
						palette: {
							core: [
								{
									slug: 'red-cherry',
									color: presetPropertyValue,
								},
							],
							theme: [
								{
									slug: 'red-vintage',
									color: presetPropertyValue,
								},
							],
							user: [ { slug: 'red', color: '#ff0000' } ],
						},
					},
				},
			},
		};
		const blockName = 'core/paragraph';
		const presetPropertyName = 'color';
		const result = getPresetVariableFromValue(
			features,
			blockName,
			presetPropertyName,
			presetPropertyValue
		);
		expect( result ).toBe( 'var:preset|color|red-vintage' );
	} );

	it( 'returns the theme-provided preset variable when the value matches only the theme preset', () => {
		const presetPropertyValue = '#990F02';
		const features = {
			color: {
				palette: {
					core: [],
					theme: [],
					user: [],
				},
			},
			blocks: {
				'core/paragraph': {
					color: {
						palette: {
							core: [
								{
									slug: 'red-cherry',
									color: '#ff0000',
								},
							],
							theme: [
								{
									slug: 'red-vintage',
									color: presetPropertyValue,
								},
							],
							user: [ { slug: 'red', color: '#ff0000' } ],
						},
					},
				},
			},
		};
		const blockName = 'core/paragraph';
		const presetPropertyName = 'color';
		const result = getPresetVariableFromValue(
			features,
			blockName,
			presetPropertyName,
			presetPropertyValue
		);
		expect( result ).toBe( 'var:preset|color|red-vintage' );
	} );

	it( 'returns the core-provided preset variable when the value matches only the core preset', () => {
		const presetPropertyValue = '#990F02';
		const features = {
			color: {
				palette: {
					core: [],
					theme: [],
					user: [],
				},
			},
			blocks: {
				'core/paragraph': {
					color: {
						palette: {
							core: [
								{
									slug: 'red-cherry',
									color: presetPropertyValue,
								},
							],
							theme: [
								{
									slug: 'red-vintage',
									color: '#ff0000',
								},
							],
							user: [ { slug: 'red', color: '#ff0000' } ],
						},
					},
				},
			},
		};
		const blockName = 'core/paragraph';
		const presetPropertyName = 'color';
		const result = getPresetVariableFromValue(
			features,
			blockName,
			presetPropertyName,
			presetPropertyValue
		);
		expect( result ).toBe( 'var:preset|color|red-cherry' );
	} );

	it( 'returns the same value when the preset has been overriden by a higher priority origin', () => {
		const presetPropertyValue = '#990F02';
		const features = {
			color: {
				palette: {
					core: [],
					theme: [],
					user: [],
				},
			},
			blocks: {
				'core/paragraph': {
					color: {
						palette: {
							core: [
								{
									slug: 'red',
									color: presetPropertyValue,
								},
							],
							theme: [
								{
									slug: 'red',
									color: presetPropertyValue,
								},
							],
							user: [ { slug: 'red', color: '#ff0000' } ],
						},
					},
				},
			},
		};
		const blockName = 'core/paragraph';
		const presetPropertyName = 'color';
		const result = getPresetVariableFromValue(
			features,
			blockName,
			presetPropertyName,
			presetPropertyValue
		);
		// The theme-provided value matches the given presetPropertyValue.
		// However, the user has overriden that preset (same slug),
		// hence we should ignore the theme-provided preset.
		expect( result ).toBe( presetPropertyValue );
	} );
} );
