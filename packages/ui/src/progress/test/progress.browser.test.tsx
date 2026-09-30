import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { ThemeProvider } from '@wordpress/theme';
// Browser Mode loads source CSS without the build's token fallbacks.
// eslint-disable-next-line @wordpress/no-non-module-stylesheet-imports
import '@wordpress/theme/design-tokens.css';
import * as Progress from '../index';

describe( 'Progress', () => {
	it( 'shows a thin neutral bar by default', async () => {
		await render(
			<Progress.Root value={ 50 } aria-label="Uploading">
				<Progress.Track data-testid="track">
					<Progress.Indicator data-testid="indicator" />
				</Progress.Track>
			</Progress.Root>
		);
		const track = getComputedStyle( screen.getByTestId( 'track' ) );
		// The indicator is a non-interactive presentation element.
		const indicator = getComputedStyle( screen.getByTestId( 'indicator' ) );
		expect( track.height ).toBe( '1.5px' );
		expect( track.backgroundColor ).toBe( 'rgb(219, 219, 219)' );
		expect( indicator.backgroundColor ).toBe( 'rgb(30, 30, 30)' );
	} );

	it( 'keeps the bar at 1.5px in both progress modes', async () => {
		const { rerender } = await render(
			<Progress.Root value={ 50 } aria-label="Uploading">
				<Progress.Track data-testid="track">
					<Progress.Indicator data-testid="indicator" />
				</Progress.Track>
			</Progress.Root>
		);
		const progress = screen.getByTestId( 'track' );
		const indicator = screen.getByTestId( 'indicator' );
		expect( getComputedStyle( progress ).height ).toBe( '1.5px' );
		expect( getComputedStyle( indicator ).height ).toBe( '1.5px' );

		await rerender(
			<Progress.Root value={ null } aria-label="Uploading">
				<Progress.Track data-testid="track">
					<Progress.Indicator data-testid="indicator" />
				</Progress.Track>
			</Progress.Root>
		);
		expect( getComputedStyle( progress ).height ).toBe( '1.5px' );
		expect( getComputedStyle( indicator ).height ).toBe( '1.5px' );
		expect( getComputedStyle( indicator ).width ).toBe(
			`${ progress.getBoundingClientRect().width / 2 }px`
		);
		expect( getComputedStyle( indicator ).animationName ).not.toBe(
			'none'
		);
		expect( getComputedStyle( indicator ).transitionProperty ).toBe(
			'none'
		);
	} );

	it.each( [
		[ 100, 0 ],
		[ 150, 50 ],
		[ 200, 100 ],
		[ 250, 100 ],
	] )(
		'fills Track relative to a custom range: value %i at %i percent',
		async ( value, percent ) => {
			await render(
				<Progress.Root
					value={ value }
					min={ 100 }
					max={ 200 }
					aria-label="Uploading"
				>
					<Progress.Track data-testid="track">
						<Progress.Indicator data-testid="indicator" />
					</Progress.Track>
				</Progress.Root>
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
					<Progress.Root aria-label="Neutral" value={ 50 }>
						<Progress.Track data-testid="neutral-track">
							<Progress.Indicator data-testid="neutral-indicator" />
						</Progress.Track>
					</Progress.Root>
					<Progress.Root aria-label="Brand" value={ 50 }>
						<Progress.Track data-testid="brand-track">
							<Progress.Indicator
								tone="brand"
								data-testid="brand-indicator"
							/>
						</Progress.Track>
					</Progress.Root>
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
			<Progress.Root value={ 60 } style={ { width: '240px' } }>
				<Progress.Label>Uploading files</Progress.Label>
				<Progress.Track data-testid="track">
					<Progress.Indicator />
				</Progress.Track>
				<Progress.Value />
			</Progress.Root>
		);
		const root = screen.getByRole( 'progressbar', {
			name: 'Uploading files',
		} );
		const track = screen.getByTestId( 'track' );
		const label = screen.getByText( 'Uploading files' );
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

	it( 'applies tone and custom color to the bar', async () => {
		const Example = ( { color }: { color?: string } ) => (
			<Progress.Root value={ 60 } style={ { color: 'rgb(0, 128, 0)' } }>
				<Progress.Label>Uploading files</Progress.Label>
				<Progress.Value />
				<Progress.Track data-testid="track">
					<Progress.Indicator
						tone="brand"
						color={ color }
						style={ { opacity: 0.8 } }
						data-testid="indicator"
					/>
				</Progress.Track>
			</Progress.Root>
		);
		const { rerender } = await render( <Example /> );
		const track = screen.getByTestId( 'track' );
		const indicator = screen.getByTestId( 'indicator' );
		const label = screen.getByText( 'Uploading files' );
		const value = screen.getByText( '60%' );
		const trackColor = getComputedStyle( track ).backgroundColor;
		const labelColor = getComputedStyle( label ).color;
		const valueColor = getComputedStyle( value ).color;
		const brandColor = getComputedStyle( indicator ).backgroundColor;
		expect( getComputedStyle( track ).height ).toBe( '1.5px' );

		await rerender( <Example color="rgb(139, 47, 201)" /> );
		expect( getComputedStyle( indicator ).backgroundColor ).toBe(
			'rgb(139, 47, 201)'
		);
		expect( getComputedStyle( indicator ).opacity ).toBe( '0.8' );
		expect( getComputedStyle( track ).backgroundColor ).toBe( trackColor );
		expect( getComputedStyle( label ).color ).toBe( labelColor );
		expect( getComputedStyle( value ).color ).toBe( valueColor );

		await rerender( <Example color="currentColor" /> );
		expect( getComputedStyle( indicator ).backgroundColor ).toBe(
			'rgb(0, 128, 0)'
		);

		await rerender( <Example /> );
		expect( getComputedStyle( indicator ).backgroundColor ).toBe(
			brandColor
		);
	} );
} );
