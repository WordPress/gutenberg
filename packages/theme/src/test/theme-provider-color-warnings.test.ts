import { renderHook } from '@testing-library/react';
import { DEFAULT_SEED_COLORS } from '../color-ramps';
import { useThemeProviderStyles } from '../use-theme-provider-styles';

const ADMIN_COLOR_SCHEME_CASES = [
	{
		name: 'modern',
		color: { primary: '#3858e9', background: '#222524' },
	},
	{
		name: 'fresh',
		color: { primary: '#3858e9', background: '#25292b' },
	},
	{
		name: 'midnight',
		color: { primary: '#cf4339', background: '#3d4042' },
	},
	{
		name: 'coffee',
		color: { primary: '#916745', background: '#5b534d' },
	},
	{
		name: 'ocean',
		color: { primary: '#567958', background: '#5f787f' },
	},
	{
		name: 'blue',
		color: { primary: '#437aa8', background: '#3876a8' },
	},
	{
		name: 'ectoplasm',
		color: { primary: '#646c3e', background: '#4f386e' },
	},
	{
		name: 'sunrise',
		color: { primary: '#ad631e', background: '#cc4541' },
	},
	{
		name: 'light',
		color: { primary: '#007cba', background: '#eaeeed' },
	},
] as const;

function getColorWarnings( color: { primary: string; background: string } ) {
	const { result } = renderHook( () => useThemeProviderStyles( { color } ) );

	return result.current.colorWarnings;
}

describe( 'ThemeProvider color warnings', () => {
	it.each( [
		{
			name: 'default colors',
			color: {
				primary: DEFAULT_SEED_COLORS.primary,
				background: DEFAULT_SEED_COLORS.background,
			},
		},
		{
			name: 'Ectoplasm colors',
			color: {
				primary: '#608010',
				background: '#4f386e',
			},
		},
	] )( 'returns no warnings for $name', ( { color } ) => {
		expect( getColorWarnings( color ) ).toEqual( [] );
	} );

	it.each( ADMIN_COLOR_SCHEME_CASES )(
		'returns no warnings for the $name admin color scheme',
		( { color } ) => {
			expect( getColorWarnings( color ) ).toEqual( [] );
		}
	);

	it( 'returns structured warnings for unmet semantic contrast targets', () => {
		const warnings = getColorWarnings( {
			primary: 'rgb(40% 56% 24%)',
			background: 'rgb(40% 56% 24%)',
		} );
		const warning = warnings.find(
			( item ) =>
				item.type === 'contrast' &&
				item.ramp === 'primary' &&
				item.backgroundStep === 'bgFill1' &&
				item.foregroundStep === 'fgFill'
		);

		expect( warning ).toEqual(
			expect.objectContaining( {
				type: 'contrast',
				ramp: 'primary',
				backgroundStep: 'bgFill1',
				foregroundStep: 'fgFill',
				requiredContrast: 4.5,
			} )
		);
		expect(
			warning?.type === 'contrast'
				? warning.achievedContrast
				: Number.POSITIVE_INFINITY
		).toBeLessThan( 4.5 );
	} );
} );
