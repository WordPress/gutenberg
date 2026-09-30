import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { ThemeProvider } from '@wordpress/theme';
// Browser Mode loads source CSS without the build's token fallbacks.
// eslint-disable-next-line @wordpress/no-non-module-stylesheet-imports
import '@wordpress/theme/design-tokens.css';
import * as Meter from '../index';
import * as Progress from '../../progress';

describe( 'Meter', () => {
	it( 'shows a thicker neutral bar by default', async () => {
		await render(
			<Meter.Root value={ 50 } aria-label="Storage used">
				<Meter.Track data-testid="track">
					<Meter.Indicator data-testid="indicator" />
				</Meter.Track>
			</Meter.Root>
		);
		const track = getComputedStyle( screen.getByTestId( 'track' ) );
		// The indicator is a non-interactive presentation element.
		const indicator = getComputedStyle( screen.getByTestId( 'indicator' ) );
		expect( track.height ).toBe( '8px' );
		expect( track.backgroundColor ).toBe( 'rgb(219, 219, 219)' );
		expect( indicator.backgroundColor ).toBe( 'rgb(30, 30, 30)' );
	} );

	it( 'distinguishes Meter from Progress by track height', async () => {
		await render(
			<>
				<Meter.Root value={ 50 } aria-label="Storage used">
					<Meter.Track data-testid="meter-track">
						<Meter.Indicator data-testid="meter-indicator" />
					</Meter.Track>
				</Meter.Root>
				<Progress.Root value={ 50 } aria-label="Uploading">
					<Progress.Track data-testid="progress-track">
						<Progress.Indicator />
					</Progress.Track>
				</Progress.Root>
			</>
		);
		const meter = getComputedStyle( screen.getByTestId( 'meter-track' ) );
		const progress = getComputedStyle(
			screen.getByTestId( 'progress-track' )
		);
		expect( meter.height ).toBe( '8px' );
		expect(
			getComputedStyle( screen.getByTestId( 'meter-indicator' ) ).height
		).toBe( '8px' );
		expect( progress.height ).toBe( '1.5px' );
		expect( meter.backgroundColor ).toBe( progress.backgroundColor );
		expect( meter.borderRadius ).toBe( progress.borderRadius );
	} );

	it.each( [
		[ 50, 0 ],
		[ 100, 0 ],
		[ 150, 50 ],
		[ 200, 100 ],
		[ 250, 100 ],
	] )(
		'fills Track relative to a custom range: value %i at %i percent',
		async ( value, percent ) => {
			await render(
				<Meter.Root
					value={ value }
					min={ 100 }
					max={ 200 }
					aria-label="Storage used"
				>
					<Meter.Track data-testid="track">
						<Meter.Indicator data-testid="indicator" />
					</Meter.Track>
				</Meter.Root>
			);
			const progress = screen.getByTestId( 'track' );
			const indicator = screen.getByTestId( 'indicator' );
			expect( indicator.getBoundingClientRect().width ).toBeCloseTo(
				( progress.getBoundingClientRect().width * percent ) / 100,
				1
			);
		}
	);

	it.each( [
		[ 'light', '#ffffff', '#3858e9' ],
		[ 'dark', '#1e1e1e', '#3858e9' ],
		[ 'custom', '#ffffff', '#008060' ],
	] )(
		'uses thumb tokens and keeps a neutral track in a %s theme',
		async ( _, background, primary ) => {
			await render(
				<ThemeProvider color={ { background, primary } }>
					<Meter.Root aria-label="Neutral" value={ 50 }>
						<Meter.Track data-testid="neutral-track">
							<Meter.Indicator data-testid="neutral-indicator" />
						</Meter.Track>
					</Meter.Root>
					<Meter.Root aria-label="Brand" value={ 50 }>
						<Meter.Track data-testid="brand-track">
							<Meter.Indicator
								tone="brand"
								data-testid="brand-indicator"
							/>
						</Meter.Track>
					</Meter.Root>
					<div
						data-testid="neutral-color-reference"
						style={ {
							backgroundColor:
								'var(--wpds-color-background-thumb-neutral)',
						} }
					/>
					<div
						data-testid="brand-color-reference"
						style={ {
							backgroundColor:
								'var(--wpds-color-background-thumb-brand)',
						} }
					/>
				</ThemeProvider>
			);
			const neutralIndicator = getComputedStyle(
				screen.getByTestId( 'neutral-indicator' )
			);
			expect( neutralIndicator.backgroundColor ).toBe(
				getComputedStyle(
					screen.getByTestId( 'neutral-color-reference' )
				).backgroundColor
			);
			expect( neutralIndicator.backgroundColor ).not.toBe(
				'rgba(0, 0, 0, 0)'
			);
			const neutral = screen.getByTestId( 'neutral-track' );
			const brand = screen.getByTestId( 'brand-track' );
			// The indicator has no separate semantic role.
			const indicator = getComputedStyle(
				screen.getByTestId( 'brand-indicator' )
			);
			expect( getComputedStyle( brand ).backgroundColor ).toBe(
				getComputedStyle( neutral ).backgroundColor
			);
			expect( indicator.backgroundColor ).toBe(
				getComputedStyle(
					screen.getByTestId( 'brand-color-reference' )
				).backgroundColor
			);
			expect( indicator.backgroundColor ).not.toBe(
				getComputedStyle( brand ).backgroundColor
			);
		}
	);
	it( 'keeps labels and values outside the clipped Track', async () => {
		await render(
			<Meter.Root value={ 60 } style={ { width: '240px' } }>
				<Meter.Label>Storage used</Meter.Label>
				<Meter.Track data-testid="track">
					<Meter.Indicator />
				</Meter.Track>
				<Meter.Value />
			</Meter.Root>
		);
		const root = screen.getByRole( 'meter', {
			name: 'Storage used',
		} );
		const track = screen.getByTestId( 'track' );
		const label = screen.getByText( 'Storage used' );
		const value = screen.getByText( '60%' );
		expect( label ).toBeVisible();
		expect( value ).toBeVisible();
		expect( getComputedStyle( track ).overflow ).toBe( 'hidden' );
		expect( getComputedStyle( root ).overflow ).toBe( 'visible' );
		expect( label.getBoundingClientRect().bottom ).toBeLessThan(
			track.getBoundingClientRect().top
		);
		expect( value.getBoundingClientRect().top ).toBeGreaterThan(
			track.getBoundingClientRect().bottom
		);
		expect( root.getBoundingClientRect().height ).toBeGreaterThan(
			track.getBoundingClientRect().height
		);
	} );

	it( 'fills from the inline start in RTL', async () => {
		await render(
			<Meter.Root value={ 25 } aria-label="Storage used" dir="rtl">
				<Meter.Track data-testid="track">
					<Meter.Indicator data-testid="indicator" />
				</Meter.Track>
			</Meter.Root>
		);
		const track = screen.getByTestId( 'track' ).getBoundingClientRect();
		const indicator = screen
			.getByTestId( 'indicator' )
			.getBoundingClientRect();
		expect( indicator.right ).toBeCloseTo( track.right, 1 );
		expect( indicator.width ).toBeCloseTo( track.width / 4, 1 );
	} );
} );
