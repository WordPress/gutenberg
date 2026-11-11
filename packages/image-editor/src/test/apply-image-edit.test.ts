import { describe, expect, it } from 'vitest';
import { applyImageEdit } from '../apply-image-edit';
import { getImageEdit, type ImageEdit } from '../get-image-edit';
import {
	areImageEditorStatesEqual,
	imageEditorReducer,
	withBaseValues,
} from '../core/state';
import { createImageEditorState } from '../react/hooks';
import type { ImageEditorState } from '../core/types';

const IMAGE = { src: 'wide.jpg', naturalWidth: 1600, naturalHeight: 900 };

function apply( state: ImageEditorState, edit: ImageEdit ): ImageEditorState {
	const result = applyImageEdit( state, edit );
	if ( ! ( 'state' in result ) ) {
		throw new Error( `Rejected as ${ result.rejected }` );
	}
	return result.state;
}

describe( 'applyImageEdit', () => {
	const clean = createImageEditorState( { image: IMAGE } );

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

	it( 'reverses the angle when one axis is flipped', () => {
		const state = apply( clean, {
			flip: { horizontal: true, vertical: false },
			rotation: 270,
		} );

		expect( state.rotation ).toBe( 90 );
	} );

	it.each( [ 720, 810 ] )( 'accepts a rotation of %i°', ( rotation ) => {
		expect( apply( clean, { rotation } ).rotation ).toBe( rotation % 360 );
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

	it( 'keeps a locked ratio when the crop has that ratio', () => {
		const square = createImageEditorState( {
			image: IMAGE,
			aspectRatio: 1,
		} );
		// 450 by 450 pixels.
		const state = apply( square, {
			crop: { x: 0.3, y: 0.25, width: 0.28125, height: 0.5 },
		} );

		expect( state.aspectRatio ).toBe( 1 );
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
			'outside-image',
			clean,
			{ crop: { x: 0.8, y: 0, width: 0.5, height: 1 } },
		],
		[
			// A tilted image's bounds have empty corners.
			'outside-image',
			clean,
			{ rotation: 10 },
		],
		[
			// 800 by 400 pixels.
			'locked-ratio',
			createImageEditorState( { image: IMAGE, aspectRatio: 1 } ),
			{ crop: { x: 0.25, y: 0.25, width: 0.5, height: 4 / 9 } },
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
} );
