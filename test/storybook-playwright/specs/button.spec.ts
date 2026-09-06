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
					border: styles.borderTopColor,
					foreground: styles.color,
				};
			} );

		const getContrast = async ( button: Locator ) =>
			button.evaluate( ( element ) => {
				const parseColor = ( color: string ): number[] => {
					const channels = color.match( /[\d.]+/g )!.map( Number );
					return [
						channels[ 0 ],
						channels[ 1 ],
						channels[ 2 ],
						channels[ 3 ] ?? 1,
					];
				};
				const composite = (
					foreground: readonly number[],
					background: readonly number[]
				) => {
					const alpha =
						foreground[ 3 ] +
						background[ 3 ] * ( 1 - foreground[ 3 ] );
					if ( alpha === 0 ) {
						return [ 0, 0, 0, 0 ];
					}
					return [
						...foreground
							.slice( 0, 3 )
							.map(
								( channel, index ) =>
									( channel * foreground[ 3 ] +
										background[ index ] *
											background[ 3 ] *
											( 1 - foreground[ 3 ] ) ) /
									alpha
							),
						alpha,
					];
				};
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
				let background = parseColor( styles.backgroundColor );
				let ancestor = element.parentElement;
				while ( ancestor && background[ 3 ] < 1 ) {
					background = composite(
						background,
						parseColor(
							getComputedStyle( ancestor ).backgroundColor
						)
					);
					ancestor = ancestor.parentElement;
				}
				background = composite( background, [ 255, 255, 255, 1 ] );
				const backgroundLuminance = getLuminance(
					`rgb(${ background.slice( 0, 3 ).join( ',' ) })`
				);

				return (
					( Math.max( foreground, backgroundLuminance ) + 0.05 ) /
					( Math.min( foreground, backgroundLuminance ) + 0.05 )
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

		const expectColorPair = async (
			button: Locator,
			background: string,
			foreground: string
		) => {
			expect( await getColors( button ) ).toMatchObject( {
				background: await getResolvedTokenColor( button, background ),
				foreground: await getResolvedTokenColor( button, foreground ),
			} );
		};

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

		const brandWeakColorTokens = {
			restBackground: 'transparent',
			restForeground: 'var(--wpds-color-foreground-interactive-brand)',
			activeBackground:
				'var(--wpds-color-background-interactive-brand-weak-active)',
			activeForeground:
				'var(--wpds-color-foreground-interactive-brand-active)',
			disabledBackground: 'transparent',
			disabledForeground:
				'var(--wpds-color-foreground-interactive-brand-disabled)',
		};

		const errorWeakColorTokens = {
			restBackground: 'transparent',
			restForeground: 'var(--wpds-color-foreground-interactive-error)',
			activeBackground:
				'var(--wpds-color-background-interactive-error-weak-active)',
			activeForeground:
				'var(--wpds-color-foreground-interactive-error-active)',
			disabledBackground: 'transparent',
			disabledForeground:
				'var(--wpds-color-foreground-interactive-error-disabled)',
		};

		const neutralStrongColorTokens = {
			restBackground:
				'var(--wpds-color-background-interactive-neutral-strong)',
			restForeground:
				'var(--wpds-color-foreground-interactive-neutral-strong)',
			activeBackground:
				'var(--wpds-color-background-interactive-neutral-strong-active)',
			activeForeground:
				'var(--wpds-color-foreground-interactive-neutral-strong-active)',
			disabledBackground:
				'var(--wpds-color-background-interactive-neutral-strong-disabled)',
			disabledForeground:
				'var(--wpds-color-foreground-interactive-neutral-strong-disabled)',
		};

		const brandLinkColorTokens = {
			restBackground: 'transparent',
			restForeground: 'var(--wpds-color-foreground-interactive-brand)',
			activeBackground: 'transparent',
			activeForeground:
				'var(--wpds-color-foreground-interactive-brand-active)',
			disabledBackground: 'transparent',
			disabledForeground:
				'var(--wpds-color-foreground-interactive-neutral-disabled)',
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
			await page.emulateMedia( { reducedMotion: 'reduce' } );
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
				border: await button.evaluate(
					( element ) => getComputedStyle( element ).borderTopColor
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
				border: await button.evaluate(
					( element ) => getComputedStyle( element ).borderTopColor
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
				border: await disabledButton.evaluate(
					( element ) => getComputedStyle( element ).borderTopColor
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

		const expectMatchingVariantColors = async ( {
			page,
			button,
			disabledButton,
			tokens,
			borderTokens,
			focusState = 'rest',
		}: {
			page: Page;
			button: Locator;
			disabledButton: Locator;
			tokens: typeof brandColorTokens;
			borderTokens?: {
				rest: string;
				active: string;
				disabled: string;
			};
			focusState?: 'rest' | 'active';
		} ) => {
			const resolve = ( target: Locator, token: string ) =>
				getResolvedTokenColor( target, token );
			const expected = async (
				target: Locator,
				state: 'rest' | 'active' | 'disabled'
			) => ( {
				background: await resolve(
					target,
					tokens[ `${ state }Background` as keyof typeof tokens ]
				),
				border: borderTokens
					? await resolve( target, borderTokens[ state ] )
					: await target.evaluate(
							( element ) =>
								getComputedStyle( element ).borderTopColor
					  ),
				foreground: await resolve(
					target,
					tokens[ `${ state }Foreground` as keyof typeof tokens ]
				),
			} );

			await expect( button ).toBeVisible();
			expect( await getColors( button ) ).toEqual(
				await expected( button, 'rest' )
			);
			expect( await getContrast( button ) ).toBeGreaterThanOrEqual( 4.5 );

			await button.focus();
			expect( await getColors( button ) ).toEqual(
				await expected( button, focusState )
			);
			expect( await getContrast( button ) ).toBeGreaterThanOrEqual( 4.5 );
			await button.evaluate( ( element ) =>
				( element as HTMLElement ).blur()
			);

			await button.hover();
			expect( await getColors( button ) ).toEqual(
				await expected( button, 'active' )
			);
			expect( await getContrast( button ) ).toBeGreaterThanOrEqual( 4.5 );

			await page.mouse.down();
			expect( await getColors( button ) ).toEqual(
				await expected( button, 'active' )
			);
			expect( await getContrast( button ) ).toBeGreaterThanOrEqual( 4.5 );
			await page.mouse.up();

			expect( await getColors( disabledButton ) ).toEqual(
				await expected( disabledButton, 'disabled' )
			);
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

		themes.forEach( ( { name, decorators } ) => {
			test( `uses matching WPDS error colors for destructive primary states in the ${ name } theme`, async ( {
				page,
			} ) => {
				await openButtonStory( page, decorators );
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

		themes.forEach( ( { name, decorators } ) => {
			test( `uses WPDS brand colors for secondary, tertiary, link, pressed, disabled, and busy states in the ${ name } theme`, async ( {
				page,
			} ) => {
				await openButtonStory( page, decorators );

				for ( const variant of [ 'secondary', 'tertiary' ] as const ) {
					await expectMatchingVariantColors( {
						page,
						button: page
							.locator( `.components-button.is-${ variant }` )
							.first(),
						disabledButton: page
							.getByRole( 'row', { name: /^disabled/ } )
							.locator( `.components-button.is-${ variant }` ),
						tokens: brandWeakColorTokens,
						borderTokens:
							variant === 'secondary'
								? {
										rest: 'var(--wpds-color-stroke-interactive-brand)',
										active: 'var(--wpds-color-stroke-interactive-brand-active)',
										disabled:
											'var(--wpds-color-stroke-interactive-brand-disabled)',
								  }
								: undefined,
					} );
				}

				const defaultButton = page
					.getByRole( 'row', { name: /^\(default\)/ } )
					.locator( '.components-button' )
					.first();
				const disabledDefaultButton = page
					.getByRole( 'row', { name: /^disabled/ } )
					.locator( '.components-button' )
					.first();
				await expectColorPair(
					defaultButton,
					'transparent',
					'var(--wpds-color-foreground-content-neutral)'
				);
				expect(
					await getContrast( defaultButton )
				).toBeGreaterThanOrEqual( 4.5 );
				await defaultButton.focus();
				await expectColorPair(
					defaultButton,
					'transparent',
					'var(--wpds-color-foreground-content-neutral)'
				);
				await defaultButton.evaluate( ( element ) =>
					( element as HTMLElement ).blur()
				);
				await defaultButton.hover();
				await expectColorPair(
					defaultButton,
					'transparent',
					'var(--wpds-color-foreground-interactive-brand)'
				);
				expect(
					await getContrast( defaultButton )
				).toBeGreaterThanOrEqual( 4.5 );
				await page.mouse.down();
				await expectColorPair(
					defaultButton,
					'transparent',
					'var(--wpds-color-foreground-content-neutral)'
				);
				expect(
					await getContrast( defaultButton )
				).toBeGreaterThanOrEqual( 4.5 );
				await page.mouse.up();
				await defaultButton.evaluate( ( element ) =>
					element.setAttribute( 'aria-expanded', 'true' )
				);
				await expectColorPair(
					defaultButton,
					'transparent',
					'var(--wpds-color-foreground-interactive-brand)'
				);
				await expectColorPair(
					disabledDefaultButton,
					'transparent',
					'var(--wpds-color-foreground-interactive-neutral-disabled)'
				);

				await expectMatchingVariantColors( {
					page,
					button: page
						.locator( '.components-button.is-link' )
						.first(),
					disabledButton: page
						.getByRole( 'row', { name: /^disabled/ } )
						.locator( '.components-button.is-link' ),
					tokens: brandLinkColorTokens,
				} );

				const pressedButtons = page
					.getByRole( 'row', { name: /^isPressed/ } )
					.first()
					.locator( '.components-button' );
				const disabledPressedButtons = page
					.getByRole( 'row', { name: /^isPressed disabled/ } )
					.locator( '.components-button' );
				for (
					let index = 0;
					index < ( await pressedButtons.count() );
					index++
				) {
					await expectMatchingVariantColors( {
						page,
						button: pressedButtons.nth( index ),
						disabledButton: disabledPressedButtons.nth( index ),
						tokens: neutralStrongColorTokens,
						focusState: 'active',
					} );
				}

				const busyButton = page
					.getByRole( 'row', { name: /^isBusy/ } )
					.locator( '.components-button' )
					.first();
				const busyBackground = await busyButton.evaluate(
					( element ) => getComputedStyle( element ).backgroundImage
				);
				for ( const token of [
					'var(--wpds-color-background-surface-neutral-strong)',
					'var(--wpds-color-background-surface-neutral)',
				] ) {
					expect( busyBackground ).toContain(
						await getResolvedTokenColor( busyButton, token )
					);
				}
			} );
		} );

		themes.forEach( ( { name, decorators } ) => {
			test( `uses WPDS error colors for destructive default, secondary, and tertiary states in the ${ name } theme`, async ( {
				page,
			} ) => {
				await openButtonStory( page, decorators );

				for ( const variant of [ 'secondary', 'tertiary' ] as const ) {
					await expectMatchingVariantColors( {
						page,
						button: page
							.getByRole( 'row', { name: /^isDestructive/ } )
							.first()
							.locator( `.components-button.is-${ variant }` ),
						disabledButton: page
							.getByRole( 'row', {
								name: /^isDestructive disabled/,
							} )
							.locator( `.components-button.is-${ variant }` ),
						tokens: errorWeakColorTokens,
						borderTokens:
							variant === 'secondary'
								? {
										rest: 'var(--wpds-color-stroke-interactive-error)',
										active: 'var(--wpds-color-stroke-interactive-error-active)',
										disabled:
											'var(--wpds-color-stroke-interactive-error-disabled)',
								  }
								: undefined,
					} );
				}

				for ( const variant of [ 'default', 'link' ] as const ) {
					const destructiveRow = page
						.getByRole( 'row', { name: /^isDestructive/ } )
						.first();
					const disabledRow = page.getByRole( 'row', {
						name: /^isDestructive disabled/,
					} );
					const selector =
						variant === 'link'
							? '.components-button.is-link'
							: '.components-button:not(.is-primary, .is-secondary, .is-tertiary, .is-link)';
					const button = destructiveRow.locator( selector );
					const disabledButton = disabledRow.locator( selector );

					await expectColorPair(
						button,
						'transparent',
						'var(--wpds-color-foreground-interactive-error)'
					);
					expect(
						await getContrast( button )
					).toBeGreaterThanOrEqual( 4.5 );
					await button.focus();
					await expectColorPair(
						button,
						'transparent',
						'var(--wpds-color-foreground-interactive-error)'
					);
					expect(
						await getContrast( button )
					).toBeGreaterThanOrEqual( 4.5 );
					await button.hover();
					await expectColorPair(
						button,
						'transparent',
						'var(--wpds-color-foreground-interactive-error-active)'
					);
					expect(
						await getContrast( button )
					).toBeGreaterThanOrEqual( 4.5 );
					await page.mouse.down();
					await expectColorPair(
						button,
						variant === 'default'
							? 'var(--wpds-color-background-interactive-error-active)'
							: 'transparent',
						'var(--wpds-color-foreground-interactive-error-active)'
					);
					expect(
						await getContrast( button )
					).toBeGreaterThanOrEqual( 4.5 );
					await page.mouse.up();
					await expectColorPair(
						disabledButton,
						'transparent',
						'var(--wpds-color-foreground-interactive-neutral-disabled)'
					);
				}
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
