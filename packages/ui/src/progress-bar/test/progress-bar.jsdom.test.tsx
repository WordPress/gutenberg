import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import { ProgressBar } from '../index';

describe( 'ProgressBar', () => {
	it( 'shows indeterminate progress when no value is supplied', () => {
		render( <ProgressBar aria-label="Uploading" /> );
		const progress = screen.getByRole( 'progressbar', {
			name: 'Uploading',
		} );
		expect( progress ).not.toHaveAttribute( 'aria-valuenow' );
		expect( progress ).toHaveAttribute( 'data-indeterminate' );
		expect( progress ).toHaveAttribute( 'aria-valuetext', 'In progress' );
	} );

	it( 'exposes a value within a custom range', () => {
		render( <ProgressBar value={ 150 } min={ 100 } max={ 200 } /> );
		const progress = screen.getByRole( 'progressbar' );
		expect( progress ).toHaveValue( 150 );
		expect( progress ).toHaveAttribute( 'aria-valuemin', '100' );
		expect( progress ).toHaveAttribute( 'aria-valuemax', '200' );
		expect( progress ).toHaveAttribute( 'aria-valuetext', '50%' );
	} );

	it( 'supports an external label and custom value text', () => {
		render(
			<>
				<span id="upload-label">Uploading images</span>
				<ProgressBar
					aria-labelledby="upload-label"
					value={ 3 }
					max={ 10 }
					getAriaValueText={ ( _, value ) =>
						`${ value } of 10 images`
					}
				/>
			</>
		);
		expect(
			screen.getByRole( 'progressbar', { name: 'Uploading images' } )
		).toHaveAttribute( 'aria-valuetext', '3 of 10 images' );
	} );

	it( 'forwards the ref and element props when using a custom render element', () => {
		const ref = createRef< HTMLDivElement >();
		render(
			<ProgressBar
				ref={ ref }
				render={ <div data-custom="true" /> }
				id="upload-progress"
				className="custom-progress"
				size="large"
				tone="brand"
			/>
		);
		const progress = screen.getByRole( 'progressbar' );
		expect( ref.current ).toBe( progress );
		expect( progress ).toHaveAttribute( 'data-custom', 'true' );
		expect( progress ).toHaveAttribute( 'id', 'upload-progress' );
		expect( progress ).toHaveClass( 'custom-progress' );
		expect( progress ).not.toHaveAttribute( 'size' );
		expect( progress ).not.toHaveAttribute( 'tone' );
	} );
} );
