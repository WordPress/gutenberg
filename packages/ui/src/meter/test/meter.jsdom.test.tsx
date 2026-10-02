import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import { Meter } from '../../index';

describe( 'Meter', () => {
	it( "uses Label as the meter's accessible name", () => {
		render(
			<Meter.Root value={ 60 }>
				<Meter.Label>Storage used</Meter.Label>
				<Meter.Track>
					<Meter.Indicator />
				</Meter.Track>
			</Meter.Root>
		);
		expect(
			screen.getByRole( 'meter', { name: 'Storage used' } )
		).toHaveValue( 60 );
	} );

	it( 'displays the formatted Value', () => {
		const { rerender } = render(
			<Meter.Root value={ 150 } min={ 100 } max={ 200 } locale="en-US">
				<Meter.Label>Storage used</Meter.Label>
				<Meter.Value />
			</Meter.Root>
		);
		expect( screen.getByText( '50%' ) ).toBeVisible();
		expect( screen.getByText( '50%' ) ).toHaveAttribute(
			'aria-hidden',
			'true'
		);
		expect( screen.getByRole( 'meter' ) ).toHaveAttribute(
			'aria-valuemin',
			'100'
		);
		expect( screen.getByRole( 'meter' ) ).toHaveAttribute(
			'aria-valuemax',
			'200'
		);
		expect( screen.getByRole( 'meter' ) ).toHaveAttribute(
			'aria-valuetext',
			'50%'
		);

		rerender(
			<Meter.Root
				value={ 3 }
				max={ 10 }
				locale="en-US"
				format={ { style: 'decimal' } }
			>
				<Meter.Label>Storage used</Meter.Label>
				<Meter.Value>
					{ ( formattedValue ) => `${ formattedValue } of 10 GB` }
				</Meter.Value>
			</Meter.Root>
		);
		expect( screen.getByText( '3 of 10 GB' ) ).toBeVisible();
	} );

	it( 'supports an external label and custom value text', () => {
		render(
			<>
				<span id="storage-label">Storage used</span>
				<Meter.Root
					aria-labelledby="storage-label"
					value={ 3 }
					max={ 10 }
					getAriaValueText={ ( _, value ) => `${ value } of 10 GB` }
				>
					<Meter.Track>
						<Meter.Indicator />
					</Meter.Track>
				</Meter.Root>
			</>
		);
		expect(
			screen.getByRole( 'meter', { name: 'Storage used' } )
		).toHaveAttribute( 'aria-valuetext', '3 of 10 GB' );
	} );

	it( 'forwards refs and element props when rendering custom elements', () => {
		const rootRef = createRef< HTMLDivElement >();
		const trackRef = createRef< HTMLDivElement >();
		const indicatorRef = createRef< HTMLDivElement >();
		const labelRef = createRef< HTMLSpanElement >();
		const valueRef = createRef< HTMLSpanElement >();
		render(
			<Meter.Root
				ref={ rootRef }
				value={ 60 }
				render={ <div data-custom="root" /> }
				className="custom-meter"
			>
				<Meter.Label
					ref={ labelRef }
					render={ <span data-custom="label" /> }
				>
					Storage used
				</Meter.Label>
				<Meter.Track
					ref={ trackRef }
					render={ <div data-custom="track" /> }
				>
					<Meter.Indicator
						ref={ indicatorRef }
						tone="brand"
						render={ <div data-custom="indicator" /> }
					/>
				</Meter.Track>
				<Meter.Value
					ref={ valueRef }
					render={ <span data-custom="value" /> }
				/>
			</Meter.Root>
		);
		expect( rootRef.current ).toBe(
			screen.getByRole( 'meter', { name: 'Storage used' } )
		);
		expect( rootRef.current ).toHaveClass( 'custom-meter' );
		expect( labelRef.current ).toBe( screen.getByText( 'Storage used' ) );
		expect( valueRef.current ).toBe( screen.getByText( '60%' ) );
		for ( const [ ref, name ] of [
			[ rootRef, 'root' ],
			[ trackRef, 'track' ],
			[ indicatorRef, 'indicator' ],
			[ labelRef, 'label' ],
			[ valueRef, 'value' ],
		] as const ) {
			expect( ref.current ).toHaveAttribute( 'data-custom', name );
		}
		expect( indicatorRef.current ).not.toHaveAttribute( 'tone' );
	} );
} );
