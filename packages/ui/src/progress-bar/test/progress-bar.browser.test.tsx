import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { ThemeProvider } from '@wordpress/theme';
// Browser Mode loads source CSS without the build's token fallbacks.
// eslint-disable-next-line @wordpress/no-non-module-stylesheet-imports
import '@wordpress/theme/design-tokens.css';
import { ProgressBar } from '../index';

describe( 'ProgressBar', () => {
	it( 'shows a thin neutral bar by default', async () => {
		await render( <ProgressBar value={ 50 } /> );
		const progress = screen.getByRole( 'progressbar' );
		const track = getComputedStyle( progress );
		// The indicator is a non-interactive presentation element.
		// eslint-disable-next-line testing-library/no-node-access
		const indicator = getComputedStyle( progress.firstElementChild! );
		expect( track.height ).toBe( '1.5px' );
		expect( track.backgroundColor ).toBe( 'rgb(219, 219, 219)' );
		expect( indicator.backgroundColor ).toBe( 'rgb(30, 30, 30)' );
	} );

	it.each( [
		[ 'small', '1.5px' ],
		[ 'medium', '4px' ],
		[ 'large', '8px' ],
	] as const )(
		'uses %s thickness for both progress modes',
		async ( size, height ) => {
			const { rerender } = await render(
				<ProgressBar size={ size } value={ 50 } />
			);
			const progress = screen.getByRole( 'progressbar' );
			// The indicator has no separate semantic role.
			// eslint-disable-next-line testing-library/no-node-access
			const indicator = progress.firstElementChild!;
			expect( getComputedStyle( progress ).height ).toBe( height );
			expect( getComputedStyle( indicator ).height ).toBe( height );

			await rerender( <ProgressBar size={ size } value={ null } /> );
			expect( getComputedStyle( progress ).height ).toBe( height );
			expect( getComputedStyle( indicator ).height ).toBe( height );
			expect( getComputedStyle( indicator ).width ).toBe(
				`${ progress.getBoundingClientRect().width / 2 }px`
			);
			expect( getComputedStyle( indicator ).animationName ).not.toBe(
				'none'
			);
			expect( getComputedStyle( indicator ).transitionProperty ).toBe(
				'none'
			);
		}
	);

	it.each( [
		[ 100, 0 ],
		[ 150, 50 ],
		[ 200, 100 ],
		[ 250, 100 ],
	] )(
		'shows value %i at %i percent of a custom range',
		async ( value, percent ) => {
			await render(
				<ProgressBar value={ value } min={ 100 } max={ 200 } />
			);
			const progress = screen.getByRole( 'progressbar' );
			// The indicator has no separate semantic role.
			// eslint-disable-next-line testing-library/no-node-access
			const indicator = progress.firstElementChild!;
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
		'uses the brand token and keeps a neutral track in a %s theme',
		async ( _, background, primary ) => {
			await render(
				<ThemeProvider color={ { background, primary } }>
					<ProgressBar aria-label="Neutral" value={ 50 } />
					<ProgressBar aria-label="Brand" value={ 50 } tone="brand" />
					<div
						data-testid="brand-color-reference"
						style={ {
							backgroundColor:
								'var(--wpds-color-background-thumb-brand)',
						} }
					/>
				</ThemeProvider>
			);
			const neutral = screen.getByRole( 'progressbar', {
				name: 'Neutral',
			} );
			const brand = screen.getByRole( 'progressbar', { name: 'Brand' } );
			// The indicator has no separate semantic role.
			// eslint-disable-next-line testing-library/no-node-access
			const indicator = getComputedStyle( brand.firstElementChild! );
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
} );
