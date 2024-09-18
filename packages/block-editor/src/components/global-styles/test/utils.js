/**
 * Internal dependencies
 */
import {
	areGlobalStyleConfigsEqual,
	getBlockStyleVariationSelector,
	getPresetVariableFromValue,
	getValueFromVariable,
	scopeFeatureSelectors,
	getResolvedThemeFilePath,
	getResolvedRefValue,
	getResolvedValue,
} from '../utils';

describe( 'editor utils', () => {
	const themeJson = {
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
		styles: {
			background: {
				backgroundImage: {
					url: 'file:./assets/image.jpg',
				},
				backgroundAttachment: 'fixed',
				backgroundPosition: 'top left',
			},
			blocks: {
				'core/group': {
					background: {
						backgroundImage: {
							ref: 'styles.background.backgroundImage',
						},
					},
					dimensions: {
						minHeight: '100px',
					},
				},
			},
		},
		_links: {
			'wp:theme-file': [
				{
					name: 'file:./assets/image.jpg',
					href: 'https://wordpress.org/assets/image.jpg',
					target: 'styles.background.backgroundImage.url',
				},
				{
					name: 'file:./assets/other/image.jpg',
					href: 'https://wordpress.org/assets/other/image.jpg',
					target: "styles.blocks.['core/group'].background.backgroundImage.url",
				},
			],
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
					themeJson.settings,
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
					themeJson.settings,
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
						themeJson.settings,
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
						themeJson.settings,
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
					themeJson,
					'root',
					undefined
				);

				expect( actual ).toBe( undefined );
			} );
		} );

		describe( 'when provided a preset variable', () => {
			it( 'retrieves the correct preset value', () => {
				const actual = getValueFromVariable(
					themeJson,
					'root',
					'var:preset|color|primary'
				);

				expect( actual ).toBe( '#007cba' );
			} );
		} );

		describe( 'when provided a custom variable', () => {
			it( 'retrieves the correct custom value', () => {
				const actual = getValueFromVariable(
					themeJson,
					'root',
					'var(--wp--custom--color--secondary)'
				);

				expect( actual ).toBe( '#a65555' );
			} );
		} );

		describe( 'when provided a dynamic reference', () => {
			it( 'retrieves the referenced value', () => {
				const stylesWithRefs = {
					...themeJson,
					styles: {
						color: {
							background: {
								ref: 'styles.color.text',
							},
							text: 'purple-rain',
						},
					},
				};
				const actual = getValueFromVariable( stylesWithRefs, 'root', {
					ref: 'styles.color.text',
				} );

				expect( actual ).toBe( stylesWithRefs.styles.color.text );
			} );

			it( 'returns the originally provided value where value is dynamic reference and reference does not exist', () => {
				const stylesWithRefs = {
					...themeJson,
					styles: {
						color: {
							text: {
								ref: 'styles.background.text',
							},
						},
					},
				};
				const actual = getValueFromVariable( stylesWithRefs, 'root', {
					ref: 'styles.color.text',
				} );

				expect( actual ).toBe( stylesWithRefs.styles.color.text );
			} );

			it( 'returns the originally provided value where value is dynamic reference', () => {
				const stylesWithRefs = {
					...themeJson,
					styles: {
						color: {
							background: {
								ref: 'styles.color.text',
							},
							text: {
								ref: 'styles.background.text',
							},
						},
					},
				};
				const actual = getValueFromVariable( stylesWithRefs, 'root', {
					ref: 'styles.color.text',
				} );

				expect( actual ).toBe( stylesWithRefs.styles.color.text );
			} );
		} );
	} );

	describe( 'areGlobalStyleConfigsEqual', () => {
		test.each( [
			{ original: null, variation: null, expected: true },
			{ original: {}, variation: {}, expected: true },
			{ original: {}, variation: undefined, expected: false },
			{
				original: {
					styles: {
						color: { text: 'var(--wp--preset--color--red)' },
					},
				},
				variation: {
					styles: {
						color: { text: 'var(--wp--preset--color--blue)' },
					},
				},
				expected: false,
			},
			{ original: {}, variation: undefined, expected: false },
			{
				original: {
					styles: {
						color: { text: 'var(--wp--preset--color--red)' },
					},
					settings: {
						typography: {
							fontSize: true,
						},
					},
				},
				variation: {
					styles: {
						color: { text: 'var(--wp--preset--color--red)' },
					},
					settings: {
						typography: {
							fontSize: true,
						},
					},
				},
				expected: true,
			},
		] )(
			'.areGlobalStyleConfigsEqual( $original, $variation )',
			( { original, variation, expected } ) => {
				expect(
					areGlobalStyleConfigsEqual( original, variation )
				).toBe( expected );
			}
		);
	} );

	describe( 'getBlockStyleVariationSelector', () => {
		test.each( [
			{ type: 'empty', selector: '', expected: '.is-style-custom' },
			{
				type: 'class',
				selector: '.wp-block',
				expected: '.wp-block.is-style-custom',
			},
			{
				type: 'id',
				selector: '#wp-block',
				expected: '#wp-block.is-style-custom',
			},
			{
				type: 'element tag',
				selector: 'p',
				expected: 'p.is-style-custom',
			},
			{
				type: 'attribute',
				selector: '[style*="color"]',
				expected: '[style*="color"].is-style-custom',
			},
			{
				type: 'descendant',
				selector: '.wp-block .inner',
				expected: '.wp-block.is-style-custom .inner',
			},
			{
				type: 'comma-separated',
				selector: '.wp-block .inner, .wp-block .alternative',
				expected:
					'.wp-block.is-style-custom .inner, .wp-block.is-style-custom .alternative',
			},
			{
				type: 'pseudo',
				selector: 'div:first-child',
				expected: 'div.is-style-custom:first-child',
			},
			{
				type: ':is',
				selector: '.wp-block:is(.outer .inner:first-child)',
				expected:
					'.wp-block.is-style-custom:is(.outer .inner:first-child)',
			},
			{
				type: ':not',
				selector: '.wp-block:not(.outer .inner:first-child)',
				expected:
					'.wp-block.is-style-custom:not(.outer .inner:first-child)',
			},
			{
				type: ':has',
				selector: '.wp-block:has(.outer .inner:first-child)',
				expected:
					'.wp-block.is-style-custom:has(.outer .inner:first-child)',
			},
			{
				type: ':where',
				selector: '.wp-block:where(.outer .inner:first-child)',
				expected:
					'.wp-block.is-style-custom:where(.outer .inner:first-child)',
			},
			{
				type: 'wrapping :where',
				selector: ':where(.outer .inner:first-child)',
				expected: ':where(.outer.is-style-custom .inner:first-child)',
			},
			{
				type: 'complex',
				selector:
					'.wp:where(.something):is(.test:not(.nothing p)):has(div[style]) .content, .wp:where(.nothing):not(.test:is(.something div)):has(span[style]) .inner',
				expected:
					'.wp.is-style-custom:where(.something):is(.test:not(.nothing p)):has(div[style]) .content, .wp.is-style-custom:where(.nothing):not(.test:is(.something div)):has(span[style]) .inner',
			},
		] )(
			'should add variation class to ancestor in $type selector',
			( { selector, expected } ) => {
				expect(
					getBlockStyleVariationSelector( 'custom', selector )
				).toBe( expected );
			}
		);
	} );

	describe( 'scopeFeatureSelectors', () => {
		it( 'correctly scopes selectors while maintaining selectors object structure', () => {
			const actual = scopeFeatureSelectors( '.custom, .secondary', {
				color: '.my-block h1',
				typography: {
					root: '.my-block',
					lineHeight: '.my-block h1',
				},
			} );

			expect( actual ).toEqual( {
				color: '.custom .my-block h1, .secondary .my-block h1',
				typography: {
					root: '.custom .my-block, .secondary .my-block',
					lineHeight: '.custom .my-block h1, .secondary .my-block h1',
				},
			} );
		} );
	} );

	describe( 'getResolvedThemeFilePath()', () => {
		it.each( [
			[
				'file:./assets/image.jpg',
				'https://wordpress.org/assets/image.jpg',
				'Should return absolute URL if found in themeFileURIs',
			],
			[
				'file:./misc/image.jpg',
				'file:./misc/image.jpg',
				'Should return value if not found in themeFileURIs',
			],
			[
				'https://wordpress.org/assets/image.jpg',
				'https://wordpress.org/assets/image.jpg',
				'Should not match absolute URLs',
			],
		] )(
			'Given file %s and return value %s: %s',
			( file, returnedValue ) => {
				expect(
					getResolvedThemeFilePath(
						file,
						themeJson._links[ 'wp:theme-file' ]
					) === returnedValue
				).toBe( true );
			}
		);
	} );

	describe( 'getResolvedRefValue()', () => {
		it.each( [
			[ 'blue', 'blue', null ],
			[ 0, 0, themeJson ],
			[
				{ ref: 'styles.background.backgroundImage' },
				{ url: 'file:./assets/image.jpg' },
				themeJson,
			],
			[
				{
					ref: 'styles.blocks.core/group.background.backgroundImage',
				},
				undefined,
				themeJson,
			],
		] )(
			'Given ruleValue %s return expected value of %s',
			( ruleValue, returnedValue, tree ) => {
				expect( getResolvedRefValue( ruleValue, tree ) ).toEqual(
					returnedValue
				);
			}
		);
	} );

	describe( 'getResolvedValue()', () => {
		it.each( [
			[ 'blue', 'blue', null ],
			[ 0, 0, themeJson ],
			[
				{ ref: 'styles.background.backgroundImage' },
				{ url: 'https://wordpress.org/assets/image.jpg' },
				themeJson,
			],
			[
				{
					ref: 'styles.blocks.core/group.background.backgroundImage',
				},
				undefined,
				themeJson,
			],
		] )(
			'Given ruleValue %s return expected value of %s',
			( ruleValue, returnedValue, tree ) => {
				expect( getResolvedValue( ruleValue, tree ) ).toEqual(
					returnedValue
				);
			}
		);
	} );
} );
