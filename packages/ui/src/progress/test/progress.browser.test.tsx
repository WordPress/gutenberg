import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
// Browser Mode loads source CSS without the build's token fallbacks.
import '@wordpress/theme/design-tokens.css';
import * as Progress from '../index';

describe( 'Progress', () => {
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
		const track = screen.getByTestId( 'track' );
		const label = screen.getByText( 'Uploading files' );
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

	it( 'applies custom color and restores neutral when cleared', async () => {
		const Example = ( { color }: { color?: string } ) => (
			<Progress.Root value={ 60 } style={ { color: 'rgb(0, 128, 0)' } }>
				<Progress.Label>Uploading files</Progress.Label>
				<Progress.Value />
				<Progress.Track data-testid="track">
					<Progress.Indicator
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
		const neutralColor = getComputedStyle( indicator ).backgroundColor;

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
			neutralColor
		);
	} );
} );
