import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { ThemeProvider } from '@wordpress/theme';
import '@wordpress/theme/design-tokens.css';
import '../style.scss';
import Button from '..';

function contrast( button: HTMLElement ) {
	const style = getComputedStyle( button );
	const luminance = ( color: string ) =>
		color
			.match( /[\d.]+/g )!
			.slice( 0, 3 )
			.reduce( ( total, channel, index ) => {
				const value = Number( channel ) / 255;
				return (
					total +
					[ 0.2126, 0.7152, 0.0722 ][ index ] *
						( value <= 0.04045
							? value / 12.92
							: ( ( value + 0.055 ) / 1.055 ) ** 2.4 )
				);
			}, 0 );
	const foreground = luminance( style.color );
	const background = luminance( style.backgroundColor );
	return (
		( Math.max( foreground, background ) + 0.05 ) /
		( Math.min( foreground, background ) + 0.05 )
	);
}

describe( 'primary Button under ThemeProvider', () => {
	it.each( [ '#fcfcfc', '#1e1e1e' ] )(
		'keeps text at 4.5:1 at rest, on hover, and while active on %s',
		async ( background ) => {
			await render(
				<ThemeProvider color={ { primary: '#916745', background } }>
					<Button __next40pxDefaultSize variant="primary">
						Save
					</Button>
				</ThemeProvider>
			);
			const button = screen.getByRole( 'button', { name: 'Save' } );
			await userEvent.unhover( button );
			expect
				.soft( contrast( button ), 'rest' )
				.toBeGreaterThanOrEqual( 4.5 );
			await userEvent.hover( button );
			expect
				.soft( contrast( button ), 'hover' )
				.toBeGreaterThanOrEqual( 4.5 );
			await userEvent.click( button );
			await userEvent.unhover( button );
			await userEvent.keyboard( '[Space>]' );
			try {
				expect( button.matches( ':active' ) ).toBe( true );
				expect
					.soft( contrast( button ), 'active' )
					.toBeGreaterThanOrEqual( 4.5 );
			} finally {
				await userEvent.keyboard( '[/Space]' );
			}
		}
	);

	it( 'preserves consumer accent color overrides in all three states', async () => {
		await render(
			<ThemeProvider
				color={ { primary: '#916745', background: '#1e1e1e' } }
			>
				<div
					style={ {
						'--wp-components-color-accent': '#123456',
						'--wp-components-color-accent-darker-10': '#234567',
						'--wp-components-color-accent-darker-20': '#345678',
						'--wp-components-color-accent-inverted': '#ffffff',
					} }
				>
					<Button __next40pxDefaultSize variant="primary">
						Save
					</Button>
				</div>
			</ThemeProvider>
		);
		const button = screen.getByRole( 'button', { name: 'Save' } );
		await userEvent.unhover( button );
		expect( getComputedStyle( button ).backgroundColor ).toBe(
			'rgb(18, 52, 86)'
		);
		expect( getComputedStyle( button ).color ).toBe( 'rgb(255, 255, 255)' );
		await userEvent.hover( button );
		expect( getComputedStyle( button ).backgroundColor ).toBe(
			'rgb(35, 69, 103)'
		);
		await userEvent.click( button );
		await userEvent.unhover( button );
		await userEvent.keyboard( '[Space>]' );
		try {
			expect( button.matches( ':active' ) ).toBe( true );
			expect( getComputedStyle( button ).backgroundColor ).toBe(
				'rgb(52, 86, 120)'
			);
		} finally {
			await userEvent.keyboard( '[/Space]' );
		}
	} );
} );
