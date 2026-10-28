/* eslint-disable @wordpress/no-unknown-ds-tokens -- CSSOM assertions require custom property names, not CSS var() values. */
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { ThemeProvider } from '@wordpress/theme';
import { plus } from '@wordpress/icons';
import '@wordpress/theme/design-tokens.css';
import '../../button-group/style.scss';
import '../style.scss';
import '../../toolbar/toolbar/style.scss';
import Button from '..';
import ButtonGroup from '../../button-group';
import { Toolbar, ToolbarButton } from '../../toolbar';

const variants = [ 'primary', 'secondary', 'tertiary' ] as const;

function pixels( color: string ) {
	const context = document.createElement( 'canvas' ).getContext( '2d' )!;
	context.fillStyle = color;
	context.fillRect( 0, 0, 1, 1 );
	return Array.from( context.getImageData( 0, 0, 1, 1 ).data );
}

function expectToken( element: Element, property: string, token: string ) {
	const style = getComputedStyle( element );
	expect( pixels( style.getPropertyValue( property ) ) ).toEqual(
		pixels( style.getPropertyValue( token ) )
	);
}

function contrast( foreground: string, background: string, surface: string ) {
	const fg = pixels( foreground );
	const bg = pixels( background );
	const base = pixels( surface );
	const luminance = ( rgb: number[] ) =>
		rgb.reduce( ( total, channel, index ) => {
			const value = channel / 255;
			return (
				total +
				[ 0.2126, 0.7152, 0.0722 ][ index ] *
					( value <= 0.04045
						? value / 12.92
						: ( ( value + 0.055 ) / 1.055 ) ** 2.4 )
			);
		}, 0 );
	const backdrop = bg
		.slice( 0, 3 )
		.map(
			( channel, index ) =>
				channel * ( bg[ 3 ] / 255 ) +
				base[ index ] * ( 1 - bg[ 3 ] / 255 )
		);
	const text = luminance( fg.slice( 0, 3 ) );
	const fill = luminance( backdrop );
	return (
		( Math.max( text, fill ) + 0.05 ) / ( Math.min( text, fill ) + 0.05 )
	);
}

describe( 'Button styles', () => {
	it( 'keeps primary and pressed foregrounds when buttons are grouped', async () => {
		await render(
			<ButtonGroup __shouldNotWarnDeprecated>
				<Button __next40pxDefaultSize variant="primary">
					Save
				</Button>
				<Button __next40pxDefaultSize aria-pressed>
					Preview
				</Button>
			</ButtonGroup>
		);
		for ( const [ name, token ] of [
			[ 'Save', '--wpds-color-foreground-interactive-brand-strong' ],
			[
				'Preview',
				'--wpds-color-foreground-interactive-neutral-strong-active',
			],
		] ) {
			const style = getComputedStyle(
				screen.getByRole( 'button', { name } )
			);
			expect( pixels( style.color ) ).toEqual(
				pixels( style.getPropertyValue( token ) )
			);
		}
	} );

	it( 'keeps a pressed toolbar button background inset during keyboard interaction', async () => {
		await render(
			<Toolbar label="Formatting">
				<ToolbarButton icon={ plus } title="Add" isPressed />
			</Toolbar>
		);
		const button = screen.getByRole( 'button', { name: 'Add' } );
		await userEvent.tab();
		await userEvent.keyboard( '[Space>]' );
		expect( getComputedStyle( button ).backgroundColor ).toBe(
			'rgba(0, 0, 0, 0)'
		);
		expect(
			getComputedStyle( button, '::before' ).backgroundColor
		).not.toBe( 'rgba(0, 0, 0, 0)' );
		await userEvent.keyboard( '[/Space]' );
	} );
	it.each( [ 'secondary', 'tertiary' ] as const )(
		'keeps the spinner readable on a pressed disabled busy %s button',
		async ( variant ) => {
			await render(
				<Button
					__next40pxDefaultSize
					variant={ variant }
					aria-pressed
					isBusy
					disabled
				>
					Saving
				</Button>
			);
			const button = screen.getByRole( 'button', { name: 'Saving' } );
			const spinner = screen.getByTestId(
				'components-button-busy-spinner'
			);
			expect( getComputedStyle( button ).color ).toBe(
				'rgba(0, 0, 0, 0)'
			);
			expectToken(
				spinner,
				'color',
				'--wpds-color-foreground-interactive-neutral-strong-active'
			);
			expectToken(
				button,
				'background-color',
				'--wpds-color-background-interactive-neutral-strong-active'
			);
		}
	);
	it.each( variants )(
		'keeps a pressed %s button readable during Space activation away from the pointer',
		async ( variant ) => {
			await render(
				<ThemeProvider color={ { background: '#1e1e1e' } }>
					<Button
						__next40pxDefaultSize
						variant={ variant }
						aria-pressed
					>
						Preview
					</Button>
				</ThemeProvider>
			);
			const button = screen.getByRole( 'button', { name: 'Preview' } );
			await userEvent.tab();
			await userEvent.keyboard( '[Space>]' );
			expect( button.matches( ':active' ) ).toBe( true );
			expectToken(
				button,
				'color',
				'--wpds-color-foreground-interactive-neutral-strong-active'
			);
			expectToken(
				button,
				'background-color',
				'--wpds-color-background-interactive-neutral-strong-active'
			);
			await userEvent.keyboard( '[/Space]' );
		}
	);

	it.each( variants )(
		'uses readable error colors for a destructive %s button during Space activation',
		async ( variant ) => {
			await render(
				<ThemeProvider color={ { background: '#1e1e1e' } }>
					<Button
						__next40pxDefaultSize
						variant={ variant }
						isDestructive
					>
						Delete
					</Button>
				</ThemeProvider>
			);
			const button = screen.getByRole( 'button', { name: 'Delete' } );
			await userEvent.tab();
			await userEvent.keyboard( '[Space>]' );
			const style = getComputedStyle( button );
			expect(
				contrast(
					style.color,
					style.backgroundColor,
					style.getPropertyValue(
						'--wpds-color-background-surface-neutral'
					)
				)
			).toBeGreaterThanOrEqual( 4.5 );
			await userEvent.keyboard( '[/Space]' );
		}
	);

	it.each( [
		[ 'small', 24 ],
		[ 'compact', 32 ],
	] as const )(
		'keeps %s buttons with an icon and label at %ipx',
		async ( size, height ) => {
			await render(
				<>
					<Button __next40pxDefaultSize size={ size } icon={ plus }>
						Add
					</Button>
					<Button
						__next40pxDefaultSize
						size={ size }
						icon={ plus }
						label="Add item"
					/>
				</>
			);
			expect(
				screen
					.getByRole( 'button', { name: 'Add' } )
					.getBoundingClientRect().height
			).toBe( height );
			const iconButton = screen
				.getByRole( 'button', { name: 'Add item' } )
				.getBoundingClientRect();
			expect( iconButton.height ).toBe( height );
			expect( iconButton.width ).toBe( height );
		}
	);

	it.each( variants )(
		'keeps the %s busy label hidden and the spinner visible during interaction',
		async ( variant ) => {
			const onClick = vi.fn();
			await render(
				<Button
					__next40pxDefaultSize
					variant={ variant }
					isBusy
					onClick={ onClick }
				>
					Saving
				</Button>
			);
			const button = screen.getByRole( 'button', { name: 'Saving' } );
			const spinner = screen.getByTestId(
				'components-button-busy-spinner'
			);
			await userEvent.hover( button );
			expect( getComputedStyle( button ).color ).toBe(
				'rgba(0, 0, 0, 0)'
			);
			expect( getComputedStyle( spinner ).color ).not.toBe(
				'rgba(0, 0, 0, 0)'
			);
			await userEvent.tab();
			await userEvent.keyboard( '[Space>]' );
			expect( getComputedStyle( button ).color ).toBe(
				'rgba(0, 0, 0, 0)'
			);
			await userEvent.keyboard( '[/Space]' );
			expect( onClick ).toHaveBeenCalledOnce();
			expect( button ).toBeEnabled();
		}
	);

	it.each( [ 'secondary', 'tertiary' ] as const )(
		'uses the semantic resting foreground for a %s button with a custom theme',
		async ( variant ) => {
			await render(
				<ThemeProvider
					color={ { primary: '#ff9900', background: '#fcfcfc' } }
				>
					<Button __next40pxDefaultSize variant={ variant }>
						Action
					</Button>
				</ThemeProvider>
			);
			const button = screen.getByRole( 'button', { name: 'Action' } );
			await userEvent.unhover( button );
			expect( button.matches( ':hover' ) ).toBe( false );
			expectToken(
				button,
				'color',
				'--wpds-color-foreground-interactive-brand'
			);
			const style = getComputedStyle( button );
			expect(
				contrast(
					style.color,
					style.backgroundColor,
					style.getPropertyValue(
						'--wpds-color-background-surface-neutral'
					)
				)
			).toBeGreaterThanOrEqual( 4.5 );
		}
	);

	it( 'keeps the admin color scheme without a ThemeProvider', async () => {
		await render(
			<div
				style={
					{
						'--wp-admin-theme-color': '#46403c',
					} as React.CSSProperties
				}
			>
				<Button __next40pxDefaultSize variant="primary">
					Save
				</Button>
				<Button __next40pxDefaultSize variant="secondary">
					Cancel
				</Button>
				<Button __next40pxDefaultSize variant="tertiary">
					Preview
				</Button>
			</div>
		);
		expect(
			pixels(
				getComputedStyle(
					screen.getByRole( 'button', { name: 'Save' } )
				).backgroundColor
			)
		).toEqual( pixels( '#46403c' ) );
		for ( const name of [ 'Cancel', 'Preview' ] ) {
			expect(
				pixels(
					getComputedStyle( screen.getByRole( 'button', { name } ) )
						.color
				)
			).toEqual( pixels( '#46403c' ) );
		}
	} );
} );
/* eslint-enable @wordpress/no-unknown-ds-tokens */
