/* eslint-disable @wordpress/no-unknown-ds-tokens -- CSSOM assertions require custom property names, not CSS var() values. */
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import type { MouseEvent } from 'react';
import { ThemeProvider } from '@wordpress/theme';
import { plus } from '@wordpress/icons';
import '@wordpress/theme/design-tokens.css';
import '../../button-group/style.scss';
import '../style.scss';
import '../../toolbar/toolbar/style.scss';
import Button from '..';
import ButtonGroup from '../../button-group';
import { Toolbar, ToolbarButton } from '../../toolbar';

function pixels( color: string, background?: string ) {
	const context = document.createElement( 'canvas' ).getContext( '2d' )!;
	if ( background ) {
		context.fillStyle = background;
		context.fillRect( 0, 0, 1, 1 );
	}
	context.fillStyle = color;
	context.fillRect( 0, 0, 1, 1 );
	return Array.from( context.getImageData( 0, 0, 1, 1 ).data );
}

function expectVisibleStripes(
	style: Pick< CSSStyleDeclaration, 'backgroundImage' | 'backgroundColor' >
) {
	const colors = style.backgroundImage.match( /(?:rgba?|color)\([^()]+\)/g );
	expect( colors ).toHaveLength( 4 );
	expect( pixels( colors![ 0 ], style.backgroundColor ) ).not.toEqual(
		pixels( colors![ 1 ], style.backgroundColor )
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
	it.each( [
		[ undefined, false ],
		[ 'primary', false ],
		[ 'secondary', false ],
		[ 'tertiary', false ],
		[ undefined, true ],
		[ 'primary', true ],
		[ 'secondary', true ],
		[ 'tertiary', true ],
	] as const )(
		'keeps busy stripes during pointer and Space activation for %s, destructive %s',
		async ( variant, isDestructive ) => {
			let mouseDownStyle:
				| Pick<
						CSSStyleDeclaration,
						'backgroundImage' | 'backgroundColor'
				  >
				| undefined;
			await render(
				<ThemeProvider color={ { background: '#1e1e1e' } }>
					<Button
						__next40pxDefaultSize
						variant={ variant }
						isDestructive={ isDestructive }
						isBusy
						onMouseDown={ (
							event: MouseEvent< HTMLButtonElement >
						) => {
							const style = getComputedStyle(
								event.currentTarget
							);
							mouseDownStyle = {
								backgroundImage: style.backgroundImage,
								backgroundColor: style.backgroundColor,
							};
						} }
					>
						Saving
					</Button>
				</ThemeProvider>
			);
			const button = screen.getByRole( 'button', { name: 'Saving' } );
			await userEvent.unhover( button );
			const stripes = getComputedStyle( button ).backgroundImage;
			expect( stripes ).toContain( 'linear-gradient(' );
			await userEvent.hover( button );
			expect( getComputedStyle( button ).backgroundImage ).toBe(
				stripes
			);
			expectVisibleStripes( getComputedStyle( button ) );
			await userEvent.click( button );
			expect( mouseDownStyle!.backgroundImage ).toBe( stripes );
			expectVisibleStripes( mouseDownStyle! );
			await userEvent.unhover( button );
			await userEvent.keyboard( '[Space>]' );
			expect( button.matches( ':active' ) ).toBe( true );
			expect( getComputedStyle( button ).backgroundImage ).toBe(
				stripes
			);
			expectVisibleStripes( getComputedStyle( button ) );
			await userEvent.keyboard( '[/Space]' );
		}
	);

	it.each( [
		[ 'secondary', '#1e1e1e', '#3858e9' ],
		[ 'primary', '#fcfcfc', '#ff9900' ],
	] as const )(
		'keeps the busy %s label readable against both stripes on %s',
		async ( variant, background, primary ) => {
			await render(
				<ThemeProvider color={ { background, primary } }>
					<Button __next40pxDefaultSize variant={ variant } isBusy>
						Saving
					</Button>
				</ThemeProvider>
			);
			const button = screen.getByRole( 'button', { name: 'Saving' } );
			await userEvent.unhover( button );
			expect( button.matches( ':hover' ) ).toBe( false );
			const style = getComputedStyle( button );
			const stripes = style.backgroundImage.match(
				/(?:rgba?|color)\([^()]+\)/g
			);
			expect( stripes ).toHaveLength( 4 );
			for ( const stripe of new Set( stripes ) ) {
				expect(
					contrast(
						style.color,
						stripe,
						style.getPropertyValue(
							'--wpds-color-background-surface-neutral'
						)
					)
				).toBeGreaterThanOrEqual( 4.5 );
			}
		}
	);

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
	it( 'keeps a pressed tertiary button readable during Space activation away from the pointer', async () => {
		await render(
			<ThemeProvider color={ { background: '#1e1e1e' } }>
				<Button __next40pxDefaultSize variant="tertiary" aria-pressed>
					Preview
				</Button>
			</ThemeProvider>
		);
		const button = screen.getByRole( 'button', { name: 'Preview' } );
		await userEvent.unhover( button );
		await userEvent.tab();
		await userEvent.keyboard( '[Space>]' );
		expect( button.matches( ':active' ) ).toBe( true );
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
	} );

	it( 'keeps a destructive secondary border in the error palette during keyboard focus', async () => {
		await render(
			<ThemeProvider color={ { background: '#1e1e1e' } }>
				<Button __next40pxDefaultSize variant="secondary" isDestructive>
					Delete
				</Button>
			</ThemeProvider>
		);
		const button = screen.getByRole( 'button', { name: 'Delete' } );
		await userEvent.unhover( button );
		await userEvent.tab();
		expect( button.matches( ':focus' ) ).toBe( true );
		const style = getComputedStyle( button );
		// Finish the border transition before comparing its final color.
		await Promise.all(
			button.getAnimations().map( ( animation ) => animation.finished )
		);
		expect( pixels( style.borderTopColor ) ).toEqual(
			pixels(
				style.getPropertyValue(
					'--wpds-color-stroke-interactive-error'
				)
			)
		);
	} );

	it.each( [ 'primary', 'tertiary' ] as const )(
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
			await userEvent.unhover( button );
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
} );
/* eslint-enable @wordpress/no-unknown-ds-tokens */
