import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import {
	gotoStoryId,
	getAllPropsPermutations,
	testSnapshotForPropsConfig,
} from '../utils';

test.describe( 'Button', () => {
	test.describe( 'WPDS colors', () => {
		const getColors = async ( button: Locator ) =>
			button.evaluate( ( element ) => {
				const styles = getComputedStyle( element );
				return {
					background: styles.backgroundColor,
					foreground: styles.color,
				};
			} );

		const getContrast = async ( button: Locator ) =>
			button.evaluate( ( element ) => {
				const getLuminance = ( color: string ) => {
					const [ red, green, blue ] = color
						.match( /[\d.]+/g )!
						.slice( 0, 3 )
						.map( Number )
						.map( ( channel ) => {
							const value = channel / 255;
							return value <= 0.04045
								? value / 12.92
								: ( ( value + 0.055 ) / 1.055 ) ** 2.4;
						} );

					return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
				};
				const styles = getComputedStyle( element );
				const foreground = getLuminance( styles.color );
				const background = getLuminance( styles.backgroundColor );

				return (
					( Math.max( foreground, background ) + 0.05 ) /
					( Math.min( foreground, background ) + 0.05 )
				);
			} );

		const getResolvedTokenColor = async (
			button: Locator,
			variableReference: string
		) =>
			button.evaluate( ( element, variableValue ) => {
				const probe = document.createElement( 'span' );
				probe.style.setProperty( 'color', variableValue, 'important' );
				element.appendChild( probe );
				const color = getComputedStyle( probe ).color;
				probe.remove();
				return color;
			}, variableReference );

		const brandColorTokens = {
			restBackground:
				'var(--wpds-color-background-interactive-brand-strong)',
			restForeground:
				'var(--wpds-color-foreground-interactive-brand-strong)',
			activeBackground:
				'var(--wpds-color-background-interactive-brand-strong-active)',
			activeForeground:
				'var(--wpds-color-foreground-interactive-brand-strong-active)',
			disabledBackground:
				'var(--wpds-color-background-interactive-brand-strong-disabled)',
			disabledForeground:
				'var(--wpds-color-foreground-interactive-brand-strong-disabled)',
		};

		const errorColorTokens = {
			restBackground:
				'var(--wpds-color-background-interactive-error-strong)',
			restForeground:
				'var(--wpds-color-foreground-interactive-error-strong)',
			activeBackground:
				'var(--wpds-color-background-interactive-error-strong-active)',
			activeForeground:
				'var(--wpds-color-foreground-interactive-error-strong-active)',
			disabledBackground:
				'var(--wpds-color-background-interactive-error-strong-disabled)',
			disabledForeground:
				'var(--wpds-color-foreground-interactive-error-strong-disabled)',
		};

		const getPrimaryButton = ( page: Page ) =>
			page.locator( '.components-button.is-primary' ).first();

		type ThemeDecorators = {
			dsColorTheme: 'light' | 'dark' | 'custom';
			dsPrimaryColor?: string;
			dsBackgroundColor?: string;
		};

		const customTheme: ThemeDecorators = {
			dsColorTheme: 'custom',
			dsPrimaryColor: '#608010',
			dsBackgroundColor: '#4f386e',
		};

		const openButtonStory = async (
			page: Page,
			decorators: ThemeDecorators
		) => {
			await gotoStoryId( page, 'components-button--variant-states', {
				decorators,
			} );
			await expect
				.poll( () =>
					getPrimaryButton( page ).evaluate(
						( element, token ) =>
							getComputedStyle( element ).getPropertyValue(
								token.slice( 4, -1 )
							),
						brandColorTokens.restBackground
					)
				)
				.not.toBe( '' );
		};

		const expectMatchingColors = async ( {
			page,
			button,
			disabledButton,
			tokens,
		}: {
			page: Page;
			button: Locator;
			disabledButton: Locator;
			tokens: typeof brandColorTokens;
		} ) => {
			const rest = {
				background: await getResolvedTokenColor(
					button,
					tokens.restBackground
				),
				foreground: await getResolvedTokenColor(
					button,
					tokens.restForeground
				),
			};
			const active = {
				background: await getResolvedTokenColor(
					button,
					tokens.activeBackground
				),
				foreground: await getResolvedTokenColor(
					button,
					tokens.activeForeground
				),
			};
			const disabled = {
				background: await getResolvedTokenColor(
					disabledButton,
					tokens.disabledBackground
				),
				foreground: await getResolvedTokenColor(
					disabledButton,
					tokens.disabledForeground
				),
			};

			await expect( button ).toBeVisible();
			expect( await getColors( button ) ).toEqual( rest );
			expect( await getContrast( button ) ).toBeGreaterThanOrEqual( 4.5 );

			await button.focus();
			expect( await getColors( button ) ).toEqual( rest );
			expect( await getContrast( button ) ).toBeGreaterThanOrEqual( 4.5 );

			await button.hover();
			expect( await getColors( button ) ).toEqual( active );
			expect( await getContrast( button ) ).toBeGreaterThanOrEqual( 4.5 );

			await page.mouse.down();
			expect( await getColors( button ) ).toEqual( active );
			expect( await getContrast( button ) ).toBeGreaterThanOrEqual( 4.5 );
			await page.mouse.up();

			expect( await getColors( disabledButton ) ).toEqual( disabled );
		};

		const themes: Array< {
			name: string;
			decorators: ThemeDecorators;
		} > = [
			{
				name: 'light',
				decorators: { dsColorTheme: 'light' },
			},
			{
				name: 'dark',
				decorators: { dsColorTheme: 'dark' },
			},
			{ name: 'custom', decorators: customTheme },
		];

		themes.forEach( ( { name, decorators } ) => {
			test( `uses matching WPDS colors for primary states in the ${ name } theme`, async ( {
				page,
			} ) => {
				await openButtonStory( page, decorators );
				await expectMatchingColors( {
					page,
					button: getPrimaryButton( page ),
					disabledButton: page
						.getByRole( 'row', { name: /^disabled/ } )
						.locator( '.components-button.is-primary' ),
					tokens: brandColorTokens,
				} );
			} );
		} );

		test( 'uses matching WPDS error colors for destructive primary states', async ( {
			page,
		} ) => {
			await openButtonStory( page, customTheme );
			const button = page
				.locator( '.components-button.is-primary.is-destructive' )
				.first();
			const disabledButton = page
				.getByRole( 'row', { name: /^isDestructive disabled/ } )
				.locator( '.components-button.is-primary' );
			await expectMatchingColors( {
				page,
				button,
				disabledButton,
				tokens: errorColorTokens,
			} );
		} );
	} );

	test.describe( 'variant states', () => {
		test.beforeEach( async ( { page } ) => {
			gotoStoryId( page, 'components-button--variant-states', {
				decorators: { customE2EControls: 'show' },
			} );
		} );

		getAllPropsPermutations( [
			{
				propName: '__next40pxDefaultSize',
				valuesToTest: [ true, false ],
			},
		] ).forEach( ( propsConfig ) => {
			test( `should render with ${ JSON.stringify(
				propsConfig
			) }`, async ( { page } ) => {
				await testSnapshotForPropsConfig( page, propsConfig );
			} );
		} );
	} );

	test.describe( 'icon', () => {
		test.beforeEach( async ( { page } ) => {
			gotoStoryId( page, 'components-button--icon', {
				decorators: { customE2EControls: 'show' },
			} );
		} );

		getAllPropsPermutations( [
			{
				propName: '__next40pxDefaultSize',
				valuesToTest: [ true, false ],
			},
		] ).forEach( ( propsConfig ) => {
			test( `should render with ${ JSON.stringify(
				propsConfig
			) }`, async ( { page } ) => {
				await testSnapshotForPropsConfig( page, propsConfig );
			} );
		} );
	} );

	test.describe( 'dashicon', () => {
		test.beforeEach( async ( { page } ) => {
			await gotoStoryId( page, 'components-button--dashicons', {
				decorators: { css: 'wordpress' },
			} );
			// Wait for dashicons font to load
			await page.waitForFunction( () =>
				document.fonts.check( '20px dashicons' )
			);
		} );

		test( 'should render with correct spacing', async ( { page } ) => {
			expect( await page.screenshot() ).toMatchSnapshot();
		} );
	} );
} );
