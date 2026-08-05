/**
 * Internal dependencies
 */
import {
	getCanvasWidthByDeviceType,
	getDeviceTypeByCanvasWidth,
} from '../device-type';

describe( 'device type utilities', () => {
	it( 'classifies widths using default viewport breakpoints when viewport settings are not provided', () => {
		expect( getDeviceTypeByCanvasWidth( 480 ) ).toBe( 'Mobile' );
		expect( getDeviceTypeByCanvasWidth( 481 ) ).toBe( 'Tablet' );
		expect( getDeviceTypeByCanvasWidth( 782 ) ).toBe( 'Tablet' );
		expect( getDeviceTypeByCanvasWidth( 783 ) ).toBe( 'Desktop' );
		expect( getDeviceTypeByCanvasWidth( undefined ) ).toBe( 'Desktop' );
	} );

	it( 'places default device preview widths one pixel inside their breakpoints', () => {
		expect( getCanvasWidthByDeviceType( 'Mobile' ) ).toBe( 479 );
		expect( getCanvasWidthByDeviceType( 'Tablet' ) ).toBe( 781 );
		expect( getCanvasWidthByDeviceType( 'Desktop' ) ).toBeUndefined();
	} );

	it( 'keeps a tablet preview inside a tablet range narrower than one pixel', () => {
		const viewportSettings = {
			mobile: '480px',
			tablet: '480.5px',
		};
		const previewWidth = getCanvasWidthByDeviceType(
			'Tablet',
			viewportSettings
		);

		expect( previewWidth ).toBe( 480.25 );
		expect(
			getDeviceTypeByCanvasWidth( previewWidth, viewportSettings )
		).toBe( 'Tablet' );
	} );

	it( 'classifies widths using default viewport breakpoints when viewport settings are empty', () => {
		expect( getDeviceTypeByCanvasWidth( '480px', {} ) ).toBe( 'Mobile' );
		expect( getDeviceTypeByCanvasWidth( 782, {} ) ).toBe( 'Tablet' );
	} );

	it( 'uses custom pixel viewport breakpoints', () => {
		const viewportSettings = {
			mobile: '640px',
			tablet: '1024px',
		};

		expect( getCanvasWidthByDeviceType( 'Mobile', viewportSettings ) ).toBe(
			639
		);
		expect( getCanvasWidthByDeviceType( 'Tablet', viewportSettings ) ).toBe(
			1023
		);

		expect( getDeviceTypeByCanvasWidth( 640, viewportSettings ) ).toBe(
			'Mobile'
		);
		expect( getDeviceTypeByCanvasWidth( 800, viewportSettings ) ).toBe(
			'Tablet'
		);
		expect( getDeviceTypeByCanvasWidth( 1200, viewportSettings ) ).toBe(
			'Desktop'
		);
	} );

	it( 'supports non-pixel viewport breakpoints', () => {
		const viewportSettings = {
			mobile: '40rem',
			tablet: '64rem',
		};

		expect( getCanvasWidthByDeviceType( 'Tablet', viewportSettings ) ).toBe(
			1023
		);
		expect( getDeviceTypeByCanvasWidth( 640, viewportSettings ) ).toBe(
			'Mobile'
		);
		expect( getDeviceTypeByCanvasWidth( 800, viewportSettings ) ).toBe(
			'Tablet'
		);
	} );

	it( 'uses the tablet device type for a single tablet breakpoint', () => {
		const viewportSettings = {
			tablet: '64rem',
		};

		expect( getCanvasWidthByDeviceType( 'Mobile', viewportSettings ) ).toBe(
			undefined
		);
		expect( getCanvasWidthByDeviceType( 'Tablet', viewportSettings ) ).toBe(
			1023
		);
		expect( getDeviceTypeByCanvasWidth( 800, viewportSettings ) ).toBe(
			'Tablet'
		);
		expect( getDeviceTypeByCanvasWidth( 1200, viewportSettings ) ).toBe(
			'Desktop'
		);
	} );

	it( 'omits tablet when its breakpoint is not larger than mobile', () => {
		const viewportSettings = {
			mobile: '64rem',
			tablet: '40rem',
		};

		expect( getCanvasWidthByDeviceType( 'Mobile', viewportSettings ) ).toBe(
			1023
		);
		expect( getCanvasWidthByDeviceType( 'Tablet', viewportSettings ) ).toBe(
			undefined
		);
		expect( getDeviceTypeByCanvasWidth( 800, viewportSettings ) ).toBe(
			'Mobile'
		);
		expect( getDeviceTypeByCanvasWidth( 1200, viewportSettings ) ).toBe(
			'Desktop'
		);
	} );
} );
