/**
 * External dependencies
 */
import { render, fireEvent } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { ColorPicker } from '..';

/**
 * Ordinarily we'd try to select the compnoent by role but the silder role appears
 * on several elements and we'd end up encoding assumptions about order when
 * trying to select the appropriate element. We might as well just use the classname
 * on the container which will be more durable if, for example, the order changes.
 *
 * @param {HTMLElement} container
 * @return {HTMLElement} The saturation element
 */
function getSaturation( container ) {
	return container.querySelector(
		'.react-colorful__saturation .react-colorful__interactive'
	);
}

// Fix to pass `pageX` and `pageY`
// See https://github.com/testing-library/react-testing-library/issues/268
class FakeMouseEvent extends window.MouseEvent {
	constructor( type, values = {} ) {
		super( type, { buttons: 1, bubbles: true, ...values } );

		Object.assign( this, {
			pageX: values.pageX || 0,
			pageY: values.pageY || 0,
		} );
	}
}

function moveReactColorfulSlider( sliderElement, from, to ) {
	fireEvent( sliderElement, new FakeMouseEvent( 'mousedown', from ) );
	fireEvent( sliderElement, new FakeMouseEvent( 'mousemove', to ) );
}

const sleep = ( ms ) => {
	const promise = new Promise( ( resolve ) => setTimeout( resolve, ms ) );
	jest.advanceTimersByTime( ms + 1 );
	return promise;
};

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
			moveReactColorfulSlider(
				saturation,
				{ pageX: 0, pageY: 0 },
				{ pageX: 10, pageY: 10 }
			);

			// `onChange` is debounced so we need to sleep for at least 1ms before checking that onChange was called
			await sleep( 1 );

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
		moveReactColorfulSlider(
			saturation,
			{ pageX: 0, pageY: 0 },
			{ pageX: 10, pageY: 10 }
		);

		// `onChange` is debounced so we need to sleep for at least 1ms before checking that onChange was called
		await sleep( 1 );

		expect( onChange ).toHaveBeenCalledWith(
			expect.stringMatching( /^#([a-fA-F0-9]{8})$/ )
		);
	} );

	it( 'should fire onChange with the HSL value', async () => {
		const onChange = jest.fn();
		const color = {
			h: 125,
			s: 0.2,
			l: 0.5,
			// add alpha to prove it's ignored
			a: 0.5,
		};

		const { container } = render(
			<ColorPicker
				onChange={ onChange }
				color={ color }
				enableAlpha={ false }
			/>
		);

		const saturation = getSaturation( container );
		moveReactColorfulSlider(
			saturation,
			{ pageX: 0, pageY: 0 },
			{ pageX: 10, pageY: 10 }
		);

		// `onChange` is debounced so we need to sleep for at least 1ms before checking that onChange was called
		await sleep( 1 );

		expect( onChange ).toHaveBeenCalledWith(
			expect.stringMatching( /^#([a-fA-F0-9]{6})$/ )
		);
	} );
} );
