import { placeCropWindow } from '../crop-window';

describe( 'placeCropWindow', () => {
	const square = {
		imageWidth: 400,
		imageHeight: 800,
		cropWidth: 400,
		cropHeight: 400,
	};

	it( 'centres the window when there is no subject', () => {
		expect( placeCropWindow( square ) ).toEqual( { left: 0, top: 200 } );
	} );

	it( 'leaves the window centred when the subject already fits', () => {
		// A face in the middle of the frame, well inside the centre crop.
		const subject = { x: 0.4, y: 0.45, width: 0.2, height: 0.1 };

		expect( placeCropWindow( { ...square, subject } ) ).toEqual( {
			left: 0,
			top: 200,
		} );
	} );

	it( 'moves only as far as it has to when the subject would be cut', () => {
		// A face high in a portrait frame: y 0.1-0.2 is pixels 80-160, and the
		// centre crop starts at 200, so the whole thing is above the window.
		const subject = { x: 0.4, y: 0.1, width: 0.2, height: 0.1 };

		const { top } = placeCropWindow( { ...square, subject } );

		// Padding is half the subject's height either side, so the area to
		// keep starts at 40px. The window moves up to meet it and no further.
		expect( top ).toBe( 40 );
	} );

	it( 'never moves the window outside the image', () => {
		const subject = { x: 0.4, y: 0.95, width: 0.2, height: 0.05 };

		const { left, top } = placeCropWindow( { ...square, subject } );

		expect( left ).toBe( 0 );
		expect( top ).toBe( 400 );
	} );

	it( 'centres on a subject that is too big to keep whole', () => {
		// Taller than the window, so nothing can keep all of it.
		const subject = { x: 0.1, y: 0.1, width: 0.8, height: 0.8 };

		const { top } = placeCropWindow( { ...square, subject } );

		// Centre of the subject is y 0.5, or 400px, so a 400px window sits at 200.
		expect( top ).toBe( 200 );
	} );

	it( 'moves horizontally as well', () => {
		const landscape = {
			imageWidth: 800,
			imageHeight: 400,
			cropWidth: 400,
			cropHeight: 400,
		};
		const subject = { x: 0.05, y: 0.4, width: 0.1, height: 0.2 };

		const { left, top } = placeCropWindow( {
			...landscape,
			subject,
		} );

		expect( left ).toBe( 0 );
		expect( top ).toBe( 0 );
	} );

	it( 'honours a padding of zero', () => {
		const subject = { x: 0.4, y: 0.1, width: 0.2, height: 0.1 };

		const { top } = placeCropWindow( {
			...square,
			subject,
			padding: 0,
		} );

		// Without padding the window only has to reach the subject itself.
		expect( top ).toBe( 80 );
	} );
} );
