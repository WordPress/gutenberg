import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
// Browser Mode loads source CSS without the build's token fallbacks.
// eslint-disable-next-line @wordpress/no-non-module-stylesheet-imports
import '@wordpress/theme/design-tokens.css';
import * as Meter from '../index';

describe( 'Meter', () => {
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
