import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import * as Progress from '../index';

describe( 'Progress', () => {
	it( 'provides default indeterminate value text', () => {
		render(
			<Progress.Root value={ null }>
				<Progress.Label>Uploading files</Progress.Label>
				<Progress.Track>
					<Progress.Indicator />
				</Progress.Track>
			</Progress.Root>
		);
		const progress = screen.getByRole( 'progressbar', {
			name: 'Uploading files',
		} );
		expect( progress ).toHaveAttribute( 'aria-valuetext', 'In progress' );
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
