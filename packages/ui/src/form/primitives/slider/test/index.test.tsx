import { render, screen } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import * as Slider from '../index';

describe( 'Slider', () => {
	it( 'forwards ref', () => {
		const rootRef = createRef< HTMLDivElement >();
		const controlRef = createRef< HTMLDivElement >();
		const trackRef = createRef< HTMLDivElement >();
		const indicatorRef = createRef< HTMLDivElement >();
		const thumbRef = createRef< HTMLDivElement >();
		const valueRef = createRef< HTMLOutputElement >();

		render(
			<Slider.Root ref={ rootRef } defaultValue={ 50 }>
				<Slider.Value ref={ valueRef } />
				<Slider.Control ref={ controlRef }>
					<Slider.Track ref={ trackRef }>
						<Slider.Indicator ref={ indicatorRef } />
						<Slider.Thumb ref={ thumbRef } />
					</Slider.Track>
				</Slider.Control>
			</Slider.Root>
		);

		expect( rootRef.current ).toBeInstanceOf( HTMLDivElement );
		expect( controlRef.current ).toBeInstanceOf( HTMLDivElement );
		expect( trackRef.current ).toBeInstanceOf( HTMLDivElement );
		expect( indicatorRef.current ).toBeInstanceOf( HTMLDivElement );
		expect( thumbRef.current ).toBeInstanceOf( HTMLDivElement );
		expect( valueRef.current ).toBeInstanceOf( HTMLOutputElement );
	} );

	it( 'renders with default value', () => {
		render(
			<Slider.Root defaultValue={ 50 }>
				<Slider.Value data-testid="slider-value" />
				<Slider.Control>
					<Slider.Track>
						<Slider.Indicator />
						<Slider.Thumb />
					</Slider.Track>
				</Slider.Control>
			</Slider.Root>
		);

		expect( screen.getByTestId( 'slider-value' ) ).toHaveTextContent(
			'50'
		);
	} );

	it( 'renders range slider with multiple thumbs', () => {
		const rootRef = createRef< HTMLDivElement >();
		const thumb1Ref = createRef< HTMLDivElement >();
		const thumb2Ref = createRef< HTMLDivElement >();

		render(
			<Slider.Root ref={ rootRef } defaultValue={ [ 25, 75 ] }>
				<Slider.Control>
					<Slider.Track>
						<Slider.Indicator />
						<Slider.Thumb ref={ thumb1Ref } index={ 0 } />
						<Slider.Thumb ref={ thumb2Ref } index={ 1 } />
					</Slider.Track>
				</Slider.Control>
			</Slider.Root>
		);

		expect( rootRef.current ).toBeInstanceOf( HTMLDivElement );
		expect( thumb1Ref.current ).toBeInstanceOf( HTMLDivElement );
		expect( thumb2Ref.current ).toBeInstanceOf( HTMLDivElement );
	} );

	it( 'renders with custom min and max', () => {
		render(
			<Slider.Root defaultValue={ 0 } min={ -100 } max={ 100 }>
				<Slider.Value data-testid="slider-value" />
				<Slider.Control>
					<Slider.Track>
						<Slider.Indicator />
						<Slider.Thumb />
					</Slider.Track>
				</Slider.Control>
			</Slider.Root>
		);

		expect( screen.getByTestId( 'slider-value' ) ).toHaveTextContent( '0' );
	} );

	it( 'applies custom className to root', () => {
		render(
			<Slider.Root
				defaultValue={ 50 }
				className="custom-slider"
				data-testid="slider-root"
			>
				<Slider.Control>
					<Slider.Track>
						<Slider.Indicator />
						<Slider.Thumb />
					</Slider.Track>
				</Slider.Control>
			</Slider.Root>
		);

		expect( screen.getByTestId( 'slider-root' ) ).toHaveClass(
			'custom-slider'
		);
	} );
} );
