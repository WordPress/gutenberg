/**
 * External dependencies
 */
import { render, fireEvent, waitFor } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { ColorPicker } from '..';

/**
 * Ordinarily we'd try to select the component by role but the slider role appears
 * on several elements and we'd end up encoding assumptions about order when
 * trying to select the appropriate element. We might as well just use the class name
 * on the container which will be more durable if, for example, the order changes.
 */
function getSaturation( container: HTMLElement ) {
	return container.querySelector(
		'.react-colorful__saturation .react-colorful__interactive'
	);
}

type PageXPageY = { pageX: number; pageY: number };

// Fix to pass `pageX` and `pageY`
// See https://github.com/testing-library/react-testing-library/issues/268
class FakeMouseEvent extends MouseEvent {
	constructor( type: MouseEvent[ 'type' ], values?: PageXPageY ) {
		super( type, { buttons: 1, bubbles: true, ...values } );

		Object.assign( this, {
			pageX: values?.pageX ?? 0,
			pageY: values?.pageY ?? 0,
		} );
	}
}

function moveReactColorfulSlider(
	sliderElement: Element,
	from: PageXPageY,
	to: PageXPageY
) {
	fireEvent( sliderElement, new FakeMouseEvent( 'mousedown', from ) );
	fireEvent( sliderElement, new FakeMouseEvent( 'mousemove', to ) );
}

const hslaMatcher = expect.objectContaining( {
	h: expect.any( Number ),
	s: expect.any( Number ),
	l: expect.any( Number ),
	a: expect.any( Number ),
} );

const legacyColorMatcher = {
	hex: expect.any( String ),
	hsl: hslaMatcher,
	hsv: expect.objectContaining( {
		h: expect.any( Number ),
		s: expect.any( Number ),
		v: expect.any( Number ),
		a: expect.any( Number ),
	} ),
	rgb: expect.objectContaining( {
		r: expect.any( Number ),
		g: expect.any( Number ),
		b: expect.any( Number ),
		a: expect.any( Number ),
	} ),
	oldHue: expect.any( Number ),
	source: 'hex',
};

describe( 'ColorPicker', () => {
	describe( 'legacy props', () => {
		it( 'should fire onChangeComplete with the legacy color format', async () => {
			const onChangeComplete = jest.fn();
			const color = '#fff';

			const { container } = render(
				<ColorPicker
					onChangeComplete={ onChangeComplete }
					color={ color }
				/>
			);

			const saturation = getSaturation( container );

			if ( saturation === null ) {
				throw new Error( 'The saturation slider could not be found' );
			}

			expect( saturation ).toBeInTheDocument();

			moveReactColorfulSlider(
				saturation,
				{ pageX: 0, pageY: 0 },
				{ pageX: 10, pageY: 10 }
			);

			await waitFor( () =>
				expect( onChangeComplete ).toHaveBeenCalled()
			);

			expect( onChangeComplete ).toHaveBeenCalledWith(
				legacyColorMatcher
			);
		} );
	} );

	it( 'should fire onChange with the string value', async () => {
		const onChange = jest.fn();
		const color = 'rgba(1, 1, 1, 0.5)';

		const { container } = render(
			<ColorPicker onChange={ onChange } color={ color } enableAlpha />
		);

		const saturation = getSaturation( container );

		if ( saturation === null ) {
			throw new Error( 'The saturation slider could not be found' );
		}

		expect( saturation ).toBeInTheDocument();

		moveReactColorfulSlider(
			saturation,
			{ pageX: 0, pageY: 0 },
			{ pageX: 10, pageY: 10 }
		);

		await waitFor( () => expect( onChange ).toHaveBeenCalled() );

		expect( onChange ).toHaveBeenCalledWith(
			expect.stringMatching( /^#([a-fA-F0-9]{8})$/ )
		);
	} );

	it( 'should fire onChange with the HSL value', async () => {
		const onChange = jest.fn();
		const color = 'hsla(125, 20%, 50%, 0.5)';

		const { container } = render(
			<ColorPicker
				onChange={ onChange }
				color={ color }
				enableAlpha={ false }
			/>
		);

		const saturation = getSaturation( container );

		if ( saturation === null ) {
			throw new Error( 'The saturation slider could not be found' );
		}

		expect( saturation ).toBeInTheDocument();

		moveReactColorfulSlider(
			saturation,
			{ pageX: 0, pageY: 0 },
			{ pageX: 10, pageY: 10 }
		);

		await waitFor( () => expect( onChange ).toHaveBeenCalled() );

		expect( onChange ).toHaveBeenCalledWith(
			expect.stringMatching( /^#([a-fA-F0-9]{6})$/ )
		);
	} );
} );
