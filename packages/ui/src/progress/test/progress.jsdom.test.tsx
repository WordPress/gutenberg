import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import * as Progress from '../index';

describe( 'Progress', () => {
	it( "uses Label as the progress bar's accessible name", () => {
		render(
			<Progress.Root value={ 60 }>
				<Progress.Label>Uploading files</Progress.Label>
				<Progress.Track>
					<Progress.Indicator />
				</Progress.Track>
			</Progress.Root>
		);
		expect(
			screen.getByRole( 'progressbar', { name: 'Uploading files' } )
		).toHaveValue( 60 );
	} );

	it( 'displays the formatted Value', () => {
		const { rerender } = render(
			<Progress.Root value={ 150 } min={ 100 } max={ 200 } locale="en-US">
				<Progress.Label>Uploading files</Progress.Label>
				<Progress.Value />
			</Progress.Root>
		);
		expect( screen.getByText( '50%' ) ).toBeVisible();
		expect( screen.getByRole( 'progressbar' ) ).toHaveAttribute(
			'aria-valuetext',
			'50%'
		);

		rerender(
			<Progress.Root
				value={ 3 }
				max={ 10 }
				locale="en-US"
				format={ { style: 'decimal' } }
			>
				<Progress.Label>Uploading files</Progress.Label>
				<Progress.Value>
					{ ( formattedValue ) => `${ formattedValue } of 10 files` }
				</Progress.Value>
			</Progress.Root>
		);
		expect( screen.getByText( '3 of 10 files' ) ).toBeVisible();
	} );

	it( 'supports indeterminate progress', () => {
		render(
			<Progress.Root value={ null }>
				<Progress.Label>Uploading files</Progress.Label>
				<Progress.Track>
					<Progress.Indicator />
				</Progress.Track>
				<Progress.Value>
					{ ( formattedValue, value ) =>
						value === null ? 'Preparing files' : formattedValue
					}
				</Progress.Value>
			</Progress.Root>
		);
		const progress = screen.getByRole( 'progressbar', {
			name: 'Uploading files',
		} );
		expect( progress ).not.toHaveAttribute( 'aria-valuenow' );
		expect( progress ).toHaveAttribute( 'data-indeterminate' );
		expect( progress ).toHaveAttribute( 'aria-valuetext', 'In progress' );
		expect( screen.getByText( 'Preparing files' ) ).toBeVisible();
	} );

	it( 'supports an external label and custom value text', () => {
		render(
			<>
				<span id="upload-label">Uploading images</span>
				<Progress.Root
					aria-labelledby="upload-label"
					value={ 3 }
					max={ 10 }
					getAriaValueText={ ( _, value ) =>
						`${ value } of 10 images`
					}
				>
					<Progress.Track>
						<Progress.Indicator />
					</Progress.Track>
				</Progress.Root>
			</>
		);
		expect(
			screen.getByRole( 'progressbar', { name: 'Uploading images' } )
		).toHaveAttribute( 'aria-valuetext', '3 of 10 images' );
	} );

	it( 'forwards refs and element props when rendering custom elements', () => {
		const rootRef = createRef< HTMLDivElement >();
		const trackRef = createRef< HTMLDivElement >();
		const indicatorRef = createRef< HTMLDivElement >();
		const labelRef = createRef< HTMLSpanElement >();
		const valueRef = createRef< HTMLSpanElement >();
		render(
			<Progress.Root
				ref={ rootRef }
				value={ 60 }
				render={ <div data-custom="root" /> }
				className="custom-progress"
			>
				<Progress.Label
					ref={ labelRef }
					render={ <span data-custom="label" /> }
				>
					Uploading files
				</Progress.Label>
				<Progress.Track
					ref={ trackRef }
					render={ <div data-custom="track" /> }
				>
					<Progress.Indicator
						ref={ indicatorRef }
						color="red"
						render={ <div data-custom="indicator" /> }
					/>
				</Progress.Track>
				<Progress.Value
					ref={ valueRef }
					render={ <span data-custom="value" /> }
				/>
			</Progress.Root>
		);
		expect( rootRef.current ).toBe(
			screen.getByRole( 'progressbar', { name: 'Uploading files' } )
		);
		expect( rootRef.current ).toHaveClass( 'custom-progress' );
		expect( labelRef.current ).toBe(
			screen.getByText( 'Uploading files' )
		);
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
		expect( indicatorRef.current ).not.toHaveAttribute( 'color' );
	} );
} );
