import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import { Meter } from '../../index';

describe( 'Meter', () => {
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
