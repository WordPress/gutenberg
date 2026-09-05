import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type VipsFactory from 'wasm-vips';
import { editImage } from '../';
import type { ImageEditModifier } from '../types';

/**
 * Records the chain of vips operations applied to a mock image.
 *
 * Each transform appends its own name (and arguments) to the shared `calls`
 * array and returns the same instance, so chained calls are captured in
 * order. The mock image reports the dimensions in `state.size`, which a crop
 * updates so a following operation sees the cropped frame.
 */
const { MockVipsImage, mockState, mockWriteToBuffer } = vi.hoisted( () => {
	const state = {
		calls: [] as string[],
		removed: [] as string[],
		hasPalette: false,
		hasAlpha: false,
		orientation: 1,
		size: { width: 100, height: 50 },
		gainmap: null as null | { calls: string[] },
		setImageCalls: [] as [ string, unknown ][],
	};

	// GType of `gint`. Only whether `getTypeof` returns non-zero matters here.
	const G_TYPE_INT = 24;

	const writeToBufferMock = vi.fn( () => ( {
		buffer: new ArrayBuffer( 0 ),
	} ) );

	class ImageMock {
		calls: string[];
		width: number;
		height: number;
		bands = 3;
		format = 'uchar';
		onProgress = () => {};
		kill = false;
		gainmap?: ImageMock;

		constructor( calls = state.calls, width = 100, height = 50 ) {
			this.calls = calls;
			this.width = width;
			this.height = height;
		}

		get pageHeight() {
			return this.height;
		}

		flipHor = vi.fn( () => {
			this.calls.push( 'flipHor' );
			return this;
		} );
		flipVer = vi.fn( () => {
			this.calls.push( 'flipVer' );
			return this;
		} );
		rot90 = vi.fn( () => {
			this.calls.push( 'rot90' );
			[ this.width, this.height ] = [ this.height, this.width ];
			return this;
		} );
		rot180 = vi.fn( () => {
			this.calls.push( 'rot180' );
			return this;
		} );
		rot270 = vi.fn( () => {
			this.calls.push( 'rot270' );
			[ this.width, this.height ] = [ this.height, this.width ];
			return this;
		} );
		rotate = vi.fn( ( angle: number, options: unknown ) => {
			this.calls.push(
				`rotate(${ angle },${ JSON.stringify( options ) })`
			);
			return this;
		} );
		crop = vi.fn(
			( left: number, top: number, width: number, height: number ) => {
				this.calls.push(
					`crop(${ left },${ top },${ width },${ height })`
				);
				this.width = width;
				this.height = height;
				return this;
			}
		);
		copy = vi.fn( () => this );
		setImage = vi.fn( ( name: string, value: unknown ) => {
			state.setImageCalls.push( [ name, value ] );
		} );
		hasAlpha = vi.fn( () => state.hasAlpha );
		remove = vi.fn( ( field: string ) => {
			state.removed.push( field );
			return true;
		} );
		writeToBuffer = writeToBufferMock;
		getTypeof = vi.fn( ( name: string ) => {
			if ( 'palette' === name ) {
				return state.hasPalette ? G_TYPE_INT : 0;
			}
			if ( 'orientation' === name ) {
				return state.orientation !== 1 ? G_TYPE_INT : 0;
			}
			return 0;
		} );
		getInt = vi.fn( ( name: string ) => {
			if ( 'orientation' === name ) {
				return state.orientation;
			}
			throw new Error( `Unknown field ${ name }` );
		} );
	}

	class VipsImageMock {
		static newFromBuffer = vi.fn( () => {
			const image = new ImageMock(
				state.calls,
				state.size.width,
				state.size.height
			);
			if ( state.gainmap ) {
				// Gain maps are typically stored at a lower resolution.
				image.gainmap = new ImageMock(
					state.gainmap.calls,
					state.size.width / 2,
					state.size.height / 2
				);
			}
			return image;
		} );
	}

	return {
		MockVipsImage: VipsImageMock,
		mockState: state,
		mockWriteToBuffer: writeToBufferMock,
	};
} );

vi.mock( import( 'wasm-vips' ), () => ( {
	default: vi.fn( () => ( {
		Image: MockVipsImage,
		Cache: {
			max: vi.fn(),
		},
	} ) ) as unknown as typeof VipsFactory,
} ) );

const buffer = new ArrayBuffer( 8 );

const flip = (
	horizontal: boolean,
	vertical: boolean
): ImageEditModifier => ( {
	type: 'flip',
	args: { flip: { horizontal, vertical } },
} );
const rotate = ( angle: number ): ImageEditModifier => ( {
	type: 'rotate',
	args: { angle },
} );
const crop = (
	left: number,
	top: number,
	width: number,
	height: number
): ImageEditModifier => ( {
	type: 'crop',
	args: { left, top, width, height },
} );

describe( 'editImage', () => {
	beforeEach( () => {
		mockState.calls.length = 0;
		mockState.removed.length = 0;
		mockState.setImageCalls.length = 0;
		mockState.hasPalette = false;
		mockState.hasAlpha = false;
		mockState.orientation = 1;
		mockState.size = { width: 100, height: 50 };
		mockState.gainmap = null;
	} );

	afterEach( () => {
		vi.clearAllMocks();
	} );

	it( 'applies modifiers in order: flip, then rotate, then crop', async () => {
		const result = await editImage( 'item', buffer, 'image/jpeg', [
			flip( true, false ),
			rotate( 90 ),
			crop( 0, 0, 50, 100 ),
		] );

		// The crop percentages apply to the rotated (50x100) frame.
		expect( mockState.calls ).toEqual( [
			'flipHor',
			'rot90',
			'crop(0,0,25,100)',
		] );
		expect( result ).toEqual( {
			buffer: expect.any( ArrayBuffer ),
			width: 25,
			height: 100,
		} );
	} );

	it( 'flips along both axes', async () => {
		await editImage( 'item', buffer, 'image/jpeg', [ flip( true, true ) ] );

		expect( mockState.calls ).toEqual( [ 'flipHor', 'flipVer' ] );
	} );

	it.each( [
		[ 90, 'rot90' ],
		[ 180, 'rot180' ],
		[ 270, 'rot270' ],
		[ -90, 'rot270' ],
		[ 450, 'rot90' ],
	] )( 'uses the exact rotation for a %i° angle', async ( angle, call ) => {
		await editImage( 'item', buffer, 'image/jpeg', [ rotate( angle ) ] );

		expect( mockState.calls ).toEqual( [ call ] );
	} );

	it( 'rotates by an arbitrary angle onto a white canvas', async () => {
		await editImage( 'item', buffer, 'image/jpeg', [ rotate( 30 ) ] );

		expect( mockState.calls ).toEqual( [
			'rotate(30,{"background":[255,255,255]})',
		] );
	} );

	it( 'rotates by an arbitrary angle onto a transparent canvas when the image has alpha', async () => {
		mockState.hasAlpha = true;

		await editImage( 'item', buffer, 'image/png', [ rotate( 30 ) ] );

		expect( mockState.calls ).toEqual( [
			'rotate(30,{"background":[0,0,0]})',
		] );
	} );

	it( 'rounds crop percentages to whole pixels', async () => {
		await editImage( 'item', buffer, 'image/jpeg', [
			crop( 10.4, 10.6, 33.3, 33.3 ),
		] );

		// 100x50 source: left 10.4 -> 10, top 5.3 -> 5, width 33.3 -> 33,
		// height 16.65 -> 17.
		expect( mockState.calls ).toEqual( [ 'crop(10,5,33,17)' ] );
	} );

	it( 'keeps a crop within the image bounds', async () => {
		await editImage( 'item', buffer, 'image/jpeg', [
			crop( 90, 90, 50, 50 ),
		] );

		expect( mockState.calls ).toEqual( [ 'crop(90,45,10,5)' ] );
	} );

	it( 'skips identity modifiers', async () => {
		const result = await editImage( 'item', buffer, 'image/jpeg', [
			flip( false, false ),
			rotate( 360 ),
			crop( 0, 0, 100, 100 ),
		] );

		expect( mockState.calls ).toEqual( [] );
		expect( result.width ).toBe( 100 );
		expect( result.height ).toBe( 50 );
	} );

	it( 'applies a pending EXIF orientation before the edits and drops the tag', async () => {
		// Orientation 6: the stored pixels need a 90° CW turn to be upright,
		// which is the frame the user previewed and cropped in.
		mockState.orientation = 6;

		await editImage( 'item', buffer, 'image/jpeg', [
			crop( 0, 0, 100, 50 ),
		] );

		// Upright frame is 50x100, so a 50% height crop is 50 pixels.
		expect( mockState.calls ).toEqual( [ 'rot90', 'crop(0,0,50,50)' ] );
		expect( mockState.removed ).toEqual( [ 'orientation' ] );
	} );

	it( 'transforms the gain map of an UltraHDR image in step with the base image', async () => {
		mockState.gainmap = { calls: [] };

		await editImage( 'item', buffer, 'image/jpeg', [
			flip( true, false ),
			rotate( 90 ),
			crop( 0, 0, 50, 100 ),
		] );

		expect( mockState.calls ).toEqual( [
			'flipHor',
			'rot90',
			'crop(0,0,25,100)',
		] );
		// The gain map is half the resolution, so the same percentages map
		// to half the pixels.
		expect( mockState.gainmap.calls ).toEqual( [
			'flipHor',
			'rot90',
			'crop(0,0,13,50)',
		] );
		// Each step re-attaches the transformed gain map.
		expect( mockState.setImageCalls ).toHaveLength( 3 );
		expect(
			mockState.setImageCalls.every( ( [ name ] ) => name === 'gainmap' )
		).toBe( true );
	} );

	it( 'keeps all metadata on the full-size result and applies the quality', async () => {
		await editImage( 'item', buffer, 'image/jpeg', [ rotate( 90 ) ], {
			quality: 0.9,
		} );

		expect( mockWriteToBuffer ).toHaveBeenCalledWith(
			'.jpeg',
			expect.objectContaining( { keep: 'all', Q: 90 } )
		);
	} );

	it( 'keeps an indexed PNG indexed', async () => {
		mockState.hasPalette = true;

		await editImage( 'item', buffer, 'image/png', [ rotate( 90 ) ] );

		expect( mockWriteToBuffer ).toHaveBeenCalledWith(
			'.png',
			expect.objectContaining( { palette: true } )
		);
	} );
} );
