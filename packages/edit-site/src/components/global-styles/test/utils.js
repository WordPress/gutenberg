/**
 * Internal dependencies
 */
import { getPresetVariableFromValue, getValueFromVariable } from '../utils';

describe( 'editor utils', () => {
	const styles = {
		version: 1,
		settings: {
			color: {
				palette: {
					theme: [
						{
							slug: 'primary',
							color: '#007cba',
							name: 'Primary',
						},
						{
							slug: 'secondary',
							color: '#006ba1',
							name: 'Secondary',
						},
					],
					custom: [
						{
							slug: 'primary',
							color: '#007cba',
							name: 'Primary',
						},
						{
							slug: 'secondary',
							color: '#a65555',
							name: 'Secondary',
						},
					],
				},
				custom: true,
				customDuotone: true,
				customGradient: true,
				link: true,
			},
			custom: {
				color: {
					primary: 'var(--wp--preset--color--primary)',
					secondary: 'var(--wp--preset--color--secondary)',
				},
			},
		},
		isGlobalStylesUserThemeJSON: true,
	};

	describe( 'getPresetVariableFromValue', () => {
		const context = 'root';
		const propertyName = 'color.text';
		const value = '#007cba';

		describe( 'when a provided global style (e.g. fontFamily, color,etc.) does not exist', () => {
			it( 'returns the originally provided value', () => {
				const actual = getPresetVariableFromValue(
					styles.settings,
					context,
					'fakePropertyName',
					value
				);
				expect( actual ).toBe( value );
			} );
		} );

		describe( 'when a global style is cleared by the user', () => {
			it( 'returns an undefined preset variable', () => {
				const actual = getPresetVariableFromValue(
					styles.settings,
					context,
					propertyName,
					undefined
				);
				expect( actual ).toBe( undefined );
			} );
		} );

		describe( 'when a global style is selected by the user', () => {
			describe( 'and it is not a preset value (e.g. custom color)', () => {
				it( 'returns the originally provided value', () => {
					const customValue = '#6e4545';
					const actual = getPresetVariableFromValue(
						styles.settings,
						context,
						propertyName,
						customValue
					);
					expect( actual ).toBe( customValue );
				} );
			} );

			describe( 'and it is a preset value', () => {
				it( 'returns the preset variable', () => {
					const actual = getPresetVariableFromValue(
						styles.settings,
						context,
						propertyName,
						value
					);
					expect( actual ).toBe( 'var:preset|color|primary' );
				} );
			} );
		} );
	} );

	describe( 'getValueFromVariable', () => {
		describe( 'when provided an invalid variable', () => {
			it( 'returns the originally provided value', () => {
				const actual = getValueFromVariable(
					styles.settings,
					'root',
					undefined
				);

				expect( actual ).toBe( undefined );
			} );
		} );

		describe( 'when provided a preset variable', () => {
			it( 'retrieves the correct preset value', () => {
				const actual = getValueFromVariable(
					styles.settings,
					'root',
					'var:preset|color|primary'
				);

				expect( actual ).toBe( '#007cba' );
			} );
		} );

		describe( 'when provided a custom variable', () => {
			it( 'retrieves the correct custom value', () => {
				const actual = getValueFromVariable(
					styles.settings,
					'root',
					'var(--wp--custom--color--secondary)'
				);

				expect( actual ).toBe( '#a65555' );
			} );
		} );
	} );
} );
