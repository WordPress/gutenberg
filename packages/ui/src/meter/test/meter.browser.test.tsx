import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
// Browser Mode loads source CSS without the build's token fallbacks.
import '@wordpress/theme/design-tokens.css';
import * as Meter from '../index';

describe( 'Meter', () => {
	it.each( [
		[ 'success', 'var(--wpds-color-background-indicator-success)' ],
		[ 'warning', 'var(--wpds-color-background-indicator-warning)' ],
		[ 'error', 'var(--wpds-color-background-indicator-error)' ],
	] as const )(
		'uses the %s indicator tone while keeping the track and text neutral',
		async ( tone, color ) => {
			await render(
				<Meter.Root value={ 60 }>
					<Meter.Label>Storage used</Meter.Label>
					<Meter.Track data-testid="track">
						<Meter.Indicator
							tone={ tone }
							data-testid="indicator"
						/>
					</Meter.Track>
					<Meter.Value />
					<span
						data-testid="expected-color"
						style={ {
							color,
							backgroundColor:
								'var(--wpds-color-background-track-neutral)',
							borderColor:
								'var(--wpds-color-foreground-content-neutral)',
						} }
					/>
				</Meter.Root>
			);
			const expected = getComputedStyle(
				screen.getByTestId( 'expected-color' )
			);
			const indicator = getComputedStyle(
				screen.getByTestId( 'indicator' )
			);
			const label = getComputedStyle(
				screen.getByText( 'Storage used' )
			);
			const value = getComputedStyle( screen.getByText( '60%' ) );
			expect( indicator.backgroundColor ).toBe( expected.color );
			expect( indicator.backgroundColor ).not.toBe( label.color );
			expect(
				getComputedStyle( screen.getByTestId( 'track' ) )
					.backgroundColor
			).toBe( expected.backgroundColor );
			expect( label.color ).toBe( expected.borderColor );
			expect( value.color ).toBe( expected.borderColor );
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
		const track = screen.getByTestId( 'track' );
		const label = screen.getByText( 'Storage used' );
		const value = screen.getByText( '60%' );
		expect( label ).toBeVisible();
		expect( value ).toBeVisible();
		expect( getComputedStyle( track ).overflow ).toBe( 'hidden' );
		expect( label.getBoundingClientRect().bottom ).toBeLessThan(
			track.getBoundingClientRect().top
		);
		expect( value.getBoundingClientRect().top ).toBeGreaterThan(
			track.getBoundingClientRect().bottom
		);
	} );
} );
