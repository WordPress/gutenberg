import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
	gotoStoryId,
	getAllPropsPermutations,
	testSnapshotForPropsConfig,
} from '../utils';

test.describe( 'Button', () => {
	test.describe( 'ThemeProvider colors', () => {
		const getColors = async ( button: ReturnType< Page[ 'locator' ] > ) =>
			button.evaluate( ( element ) => {
				const styles = getComputedStyle( element );
				return {
					background: styles.backgroundColor,
					foreground: styles.color,
				};
			} );

		const getContrast = async ( button: ReturnType< Page[ 'locator' ] > ) =>
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
			button: ReturnType< Page[ 'locator' ] >,
			variableReference: string
		) =>
			button.evaluate( ( element, variableValue ) => {
				const probe = document.createElement( 'div' );
				probe.style.setProperty( 'color', variableValue, 'important' );
				element.appendChild( probe );
				const color = getComputedStyle( probe ).color;
				probe.remove();
				return color;
			}, variableReference );

		const colorTokens = {
			restBackground:
				'var(--wpds-color-background-interactive-brand-strong)',
			restForeground:
				'var(--wpds-color-foreground-interactive-brand-strong)',
			activeBackground:
				'var(--wpds-color-background-interactive-brand-strong-active)',
			activeForeground:
				'var(--wpds-color-foreground-interactive-brand-strong-active)',
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
						colorTokens.restBackground
					)
				)
				.not.toBe( '' );
		};

		const expectMatchingPrimaryColors = async ( page: Page ) => {
			const button = getPrimaryButton( page );
			const rest = {
				background: await getResolvedTokenColor(
					button,
					colorTokens.restBackground
				),
				foreground: await getResolvedTokenColor(
					button,
					colorTokens.restForeground
				),
			};
			const active = {
				background: await getResolvedTokenColor(
					button,
					colorTokens.activeBackground
				),
				foreground: await getResolvedTokenColor(
					button,
					colorTokens.activeForeground
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
			test( `uses matching ThemeProvider colors for primary states in the ${ name } theme`, async ( {
				page,
			} ) => {
				await openButtonStory( page, decorators );
				await expectMatchingPrimaryColors( page );
			} );
		} );

		test( 'keeps destructive primary text readable in every interactive state', async ( {
			page,
		} ) => {
			await openButtonStory( page, customTheme );
			const button = page
				.locator( '.components-button.is-primary.is-destructive' )
				.first();

			await expect( button ).toBeVisible();
			expect( await getContrast( button ) ).toBeGreaterThanOrEqual( 4.5 );

			await button.focus();
			expect( await getContrast( button ) ).toBeGreaterThanOrEqual( 4.5 );

			await button.hover();
			expect( await getContrast( button ) ).toBeGreaterThanOrEqual( 4.5 );

			await page.mouse.down();
			expect( await getContrast( button ) ).toBeGreaterThanOrEqual( 4.5 );
			await page.mouse.up();
		} );

		test( 'preserves legacy primary color overrides', async ( {
			page,
		} ) => {
			await openButtonStory( page, customTheme );
			const button = getPrimaryButton( page );

			await page.evaluate( () => {
				document.documentElement.style.setProperty(
					'--wp-components-color-accent',
					'#123456'
				);
				document.documentElement.style.setProperty(
					'--wp-components-color-accent-darker-10',
					'#234567'
				);
				document.documentElement.style.setProperty(
					'--wp-components-color-accent-darker-20',
					'#345678'
				);
				document.documentElement.style.setProperty(
					'--wp-components-color-accent-inverted',
					'#ffffff'
				);
			} );

			expect( await getColors( button ) ).toEqual( {
				background: 'rgb(18, 52, 86)',
				foreground: 'rgb(255, 255, 255)',
			} );

			await button.hover();
			expect( await getColors( button ) ).toEqual( {
				background: 'rgb(35, 69, 103)',
				foreground: 'rgb(255, 255, 255)',
			} );

			await page.mouse.down();
			expect( await getColors( button ) ).toEqual( {
				background: 'rgb(52, 86, 120)',
				foreground: 'rgb(255, 255, 255)',
			} );
			await page.mouse.up();
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
