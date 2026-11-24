import { describe, expect, it } from 'vitest';
import {
	applyImageEdit,
	type ApplyImageEditOptions,
} from '../apply-image-edit';
import { getImageEdit, type ImageEdit } from '../get-image-edit';
import {
	areImageEditorStatesEqual,
	imageEditorReducer,
	withBaseValues,
} from '../core/state';
import { createImageEditorState } from '../react/hooks';
import type { ImageEditorState } from '../core/types';

const IMAGE = { src: 'wide.jpg', naturalWidth: 1600, naturalHeight: 900 };

function apply(
	state: ImageEditorState,
	edit: ImageEdit,
	options?: ApplyImageEditOptions
): ImageEditorState {
	const result = applyImageEdit( state, edit, options );
	if ( ! ( 'state' in result ) ) {
		throw new Error( `Rejected as ${ result.rejected }` );
	}
	return result.state;
}

describe( 'applyImageEdit', () => {
	const clean = createImageEditorState( { image: IMAGE } );
	const square = createImageEditorState( { image: IMAGE, aspectRatio: 1 } );

	it( 'returns the clean state for an empty edit', () => {
		expect( areImageEditorStatesEqual( apply( clean, {} ), clean ) ).toBe(
			true
		);
	} );

	it( 'treats a part left out as none, whatever the state had', () => {
		const edited = apply( clean, {
			flip: { horizontal: true, vertical: false },
			crop: { x: 0.25, y: 0.25, width: 0.5, height: 0.5 },
		} );

		expect( getImageEdit( apply( edited, { rotation: 90 } ) ) ).toEqual( {
			rotation: 90,
		} );
	} );

	it( 'reverses the angle when one axis is flipped, not both', () => {
		const one = apply( clean, {
			flip: { horizontal: true, vertical: false },
			rotation: 270,
		} );
		const both = apply( clean, {
			flip: { horizontal: true, vertical: true },
			rotation: 270,
		} );

		expect( one.rotation ).toBe( 90 );
		expect( both.rotation ).toBe( 270 );
	} );

	it.each( [
		[ 720, 0 ],
		[ 810, 90 ],
		[ -90, 270 ],
	] )( 'accepts a rotation of %i°', ( rotation, expected ) => {
		expect( apply( clean, { rotation } ).rotation ).toBe( expected );
	} );

	it( 'gives the same state whatever the pan and zoom were', () => {
		const edit = { crop: { x: 0.1, y: 0.2, width: 0.5, height: 0.3 } };
		let zoomed = imageEditorReducer( withBaseValues( clean ), {
			type: 'SET_ZOOM',
			payload: 3,
		} );
		zoomed = imageEditorReducer( zoomed, {
			type: 'SET_PAN',
			payload: { x: 0.4, y: -0.3 },
		} );

		expect(
			areImageEditorStatesEqual(
				apply( zoomed, edit ),
				apply( clean, edit )
			)
		).toBe( true );
	} );

	it( 'accepts a crop of the locked ratio as passed, even in strict mode', () => {
		// 450 by 450 pixels.
		const crop = { x: 0.3, y: 0.25, width: 0.28125, height: 0.5 };
		const state = apply( square, { crop }, { strict: true } );

		expect( getImageEdit( state )?.crop ).toEqual( {
			x: expect.closeTo( crop.x ),
			y: expect.closeTo( crop.y ),
			width: expect.closeTo( crop.width ),
			height: expect.closeTo( crop.height ),
		} );
	} );

	it.each( [
		[ 'with no ratio locked', clean, {} ],
		[ 'with a square locked', square, {} ],
		[ 'in strict mode', clean, { strict: true } ],
	] as [ string, ImageEditorState, ApplyImageEditOptions ][] )(
		'gives a missing crop the crop the rotate control picks, %s',
		( _, state, options ) => {
			const rotated = imageEditorReducer( withBaseValues( state ), {
				type: 'SET_ROTATION',
				payload: 5,
			} );

			expect(
				areImageEditorStatesEqual(
					apply( state, { rotation: 5 }, options ),
					rotated
				)
			).toBe( true );
		}
	);

	it( 'slides a crop past the edge back inside, at the same size', () => {
		const state = apply( clean, {
			crop: { x: 0.8, y: 0, width: 0.5, height: 1 },
		} );

		expect( getImageEdit( state ) ).toEqual( {
			crop: {
				x: expect.closeTo( 0.5 ),
				y: expect.closeTo( 0 ),
				width: expect.closeTo( 0.5 ),
				height: expect.closeTo( 1 ),
			},
		} );
	} );

	it( 'shrinks a crop the tilted image does not cover, keeping its shape, and moves it inside', () => {
		// The left half of the bounding box reaches into its empty corners.
		const state = apply( clean, {
			rotation: 5,
			crop: { x: 0, y: 0, width: 0.5, height: 1 },
		} );

		expect( getImageEdit( state ) ).toEqual( {
			rotation: 5,
			crop: {
				x: expect.closeTo( 0.0943, 3 ),
				y: expect.closeTo( 0.0642, 3 ),
				width: expect.closeTo( 0.4073, 3 ),
				height: expect.closeTo( 0.8145, 3 ),
			},
		} );
	} );

	it( 'keeps the width of a crop under a locked ratio when there is room', () => {
		// 800 by 400 pixels centered 425 down, so an 800 pixel square.
		const state = apply( square, {
			crop: { x: 0.25, y: 0.25, width: 0.5, height: 4 / 9 },
		} );

		expect( getImageEdit( state )?.crop ).toEqual( {
			x: expect.closeTo( 0.25 ),
			y: expect.closeTo( 25 / 900 ),
			width: expect.closeTo( 0.5 ),
			height: expect.closeTo( 800 / 900 ),
		} );
	} );

	it.each( [
		[ 'no-image', createImageEditorState(), { rotation: 90 } ],
		[
			'no-image',
			createImageEditorState( {
				image: { ...IMAGE, naturalWidth: Number.NaN },
			} ),
			{ rotation: 90 },
		],
		[ 'invalid', clean, { crop: { x: 0, y: 0, width: 0, height: 1 } } ],
		[ 'invalid', clean, { crop: { x: 0, y: 0, width: -0.5, height: 1 } } ],
		[
			// Half a pixel wide.
			'invalid',
			clean,
			{ crop: { x: 0.5, y: 0.5, width: 0.5 / 1600, height: 0.5 } },
		],
		[ 'invalid', clean, { rotation: Number.NaN } ],
		[
			// A string is truthy, so coercing it would flip the image.
			'invalid',
			clean,
			{
				flip: { horizontal: 'false', vertical: false },
			} as unknown as ImageEdit,
		],
		[
			'invalid',
			clean,
			{ crop: { x: Number.NaN, y: 0, width: 0.5, height: 0.5 } },
		],
	] as [ string, ImageEditorState, ImageEdit ][] )(
		'rejects as %s',
		( cause, state, edit ) => {
			const before = JSON.stringify( state );

			expect( applyImageEdit( state, edit ) ).toEqual( {
				rejected: cause,
			} );
			expect( JSON.stringify( state ) ).toBe( before );
		}
	);

	it.each( [
		[
			'outside-image',
			clean,
			{ crop: { x: 0.8, y: 0, width: 0.5, height: 1 } },
		],
		[
			// A tilted image's bounding box has empty corners.
			'outside-image',
			clean,
			{ rotation: 10, crop: { x: 0, y: 0, width: 1, height: 1 } },
		],
		[
			// 800 by 400 pixels.
			'locked-ratio',
			square,
			{ crop: { x: 0.25, y: 0.25, width: 0.5, height: 4 / 9 } },
		],
	] as [ string, ImageEditorState, ImageEdit ][] )(
		'rejects as %s in strict mode, rather than fit the crop',
		( cause, state, edit ) => {
			const before = JSON.stringify( state );

			expect( applyImageEdit( state, edit, { strict: true } ) ).toEqual( {
				rejected: cause,
			} );
			expect( JSON.stringify( state ) ).toBe( before );
		}
	);
} );
