/**
 * Invariants that must survive any run of edits.
 *
 * The other property tests build a single state and check it. This one
 * replays sequences through the reducer, because the invariants that
 * have broken in practice broke on a transition: an action that changed
 * the crop, or the view's shape, without putting the crop back on the
 * locked ratio.
 *
 * Sequences come from a seeded generator, so a failure replays exactly:
 * the seed is in the test name.
 */

import { describe, expect, it } from 'vitest';
import type {
	ImageEditorAction,
	InternalImageEditorState,
	NormalizedRect,
	Size,
} from '../types';
import { DEFAULT_STATE } from '../constants';
import { imageEditorReducer } from '../state';
import { getRotatedBBox } from '../camera';
import { getImageEdit, type ImageEdit } from '../../get-image-edit';
import { getOutputSize } from '../../get-output-size';
import { applyImageEdit } from '../../apply-image-edit';

const IMAGES = [
	{ src: 'wide.jpg', naturalWidth: 1600, naturalHeight: 900 },
	{ src: 'tall.jpg', naturalWidth: 900, naturalHeight: 1600 },
	{ src: 'square.jpg', naturalWidth: 1200, naturalHeight: 1200 },
];

/** A crop may sit this far off the locked ratio, relative to it. */
const RATIO_TOLERANCE = 2e-3;

/**
 * A small seeded generator, so a failing run can be replayed from its
 * seed rather than being a one-off.
 *
 * @param seed The starting seed.
 * @return A function returning the next number in [0, 1).
 */
function makeRandom( seed: number ): () => number {
	// A plain linear congruential generator: no bitwise operators, and
	// the arithmetic stays inside a safe integer.
	let state = seed;
	return () => {
		state = ( state * 1664525 + 1013904223 ) % 4294967296;
		return state / 4294967296;
	};
}

/**
 * One action a person could take, including the awkward values a real
 * control can produce: a crop larger than the view, a zoom below the
 * minimum, a ratio of zero.
 *
 * @param random The seeded generator.
 * @return The action to apply.
 */
function nextAction( random: () => number ): ImageEditorAction {
	const pick = Math.floor( random() * 10 );
	switch ( pick ) {
		case 0:
			return {
				type: 'SET_PAN',
				payload: { x: random() * 2 - 1, y: random() * 2 - 1 },
			};
		case 1:
			return { type: 'SET_ZOOM', payload: random() * 12 };
		case 2:
			return { type: 'SET_ROTATION', payload: random() * 720 - 360 };
		case 3:
			return {
				type: 'SNAP_ROTATE_90',
				payload: { direction: random() < 0.5 ? 1 : -1 },
			};
		case 4:
			return {
				type: 'SET_FLIP',
				payload: {
					horizontal: random() < 0.5,
					vertical: random() < 0.5,
				},
			};
		case 5:
			return {
				type: 'SET_CROP_RECT',
				payload: {
					x: random(),
					y: random(),
					width: random() * 1.2,
					height: random() * 1.2,
				},
			};
		case 6:
			// Zero and the odd negative stand in for a "Free" preset.
			return {
				type: 'SET_ASPECT_RATIO',
				payload: random() < 0.3 ? undefined : random() * 3 - 0.5,
			};
		case 7:
			return {
				type: 'SET_IMAGE',
				payload: IMAGES[ Math.floor( random() * IMAGES.length ) ],
			};
		case 8:
			return { type: 'SETTLE_CROP' };
		default:
			return { type: 'RESET' };
	}
}

/**
 * The view the crop is measured against: the image at its quarter turn.
 *
 * @param state The state to read.
 * @return The view's size, or `null` with no image.
 */
function viewShape( state: InternalImageEditorState ): Size | null {
	if ( ! state.image ) {
		return null;
	}
	return getRotatedBBox(
		state.image.naturalWidth,
		state.image.naturalHeight,
		Math.round( state.rotation / 90 ) * 90
	);
}

// Whether two edits match to a thousandth. Kept apart from the check in
// `applyImageEdit`, so the test does not reuse the code it tests.
function isSameEdit( a: ImageEdit | null, b: ImageEdit | null ): boolean {
	if ( ! a || ! b ) {
		return a === b;
	}
	const difference =
		( ( a.rotation ?? 0 ) - ( b.rotation ?? 0 ) + 540 ) % 360;
	const whole = { x: 0, y: 0, width: 1, height: 1 };
	const cropA = a.crop ?? whole;
	const cropB = b.crop ?? whole;
	return (
		Boolean( a.flip?.horizontal ) === Boolean( b.flip?.horizontal ) &&
		Boolean( a.flip?.vertical ) === Boolean( b.flip?.vertical ) &&
		Math.abs( difference - 180 ) < 1e-6 &&
		( [ 'x', 'y', 'width', 'height' ] as const ).every(
			( key ) => Math.abs( cropA[ key ] - cropB[ key ] ) <= 1e-3
		)
	);
}

/**
 * Every number the state holds, for one finite check.
 *
 * @param state The state to read.
 * @return The numbers it holds.
 */
function everyNumber( state: InternalImageEditorState ): number[] {
	return [
		state.pan.x,
		state.pan.y,
		state.zoom,
		state.rotation,
		state.basePan.x,
		state.basePan.y,
		state.baseZoom,
		state.baseRotation,
		state.cropRect.x,
		state.cropRect.y,
		state.cropRect.width,
		state.cropRect.height,
	];
}

describe( 'quarter turns settle rather than shrink', () => {
	// Compare the whole crop and output after each pair of turns: equal
	// area alone can hide a crop that moved or changed shape.
	const IMAGE = { src: 'w.jpg', naturalWidth: 1600, naturalHeight: 900 };
	function expectSameCrop(
		actual: NormalizedRect,
		expected: NormalizedRect
	) {
		expect( actual.x ).toBeCloseTo( expected.x, 6 );
		expect( actual.y ).toBeCloseTo( expected.y, 6 );
		expect( actual.width ).toBeCloseTo( expected.width, 6 );
		expect( actual.height ).toBeCloseTo( expected.height, 6 );
	}

	for ( const direction of [ 1, -1 ] as const ) {
		for ( const [ name, ratio ] of [
			[ 'free', undefined ],
			[ 'original', 1600 / 900 ],
			[ 'square', 1 ],
			[ '16:9', 16 / 9 ],
			[ '9:16', 9 / 16 ],
		] as [ string, number | undefined ][] ) {
			it( `restores a maximum ${ name } crop after ${ direction === 1 ? 'clockwise' : 'counter-clockwise' } turns`, () => {
				let state = imageEditorReducer(
					{ ...DEFAULT_STATE, image: IMAGE },
					{ type: 'SET_ASPECT_RATIO', payload: ratio }
				);
				const initialCrop = state.cropRect;
				const initialZoom = state.zoom;
				const initialOutput = getOutputSize( state )!;
				const turns: InternalImageEditorState[] = [];
				for ( let i = 0; i < 6; i++ ) {
					state = imageEditorReducer( state, {
						type: 'SNAP_ROTATE_90',
						payload: { direction },
					} );
					turns.push( state );
				}
				for ( const index of [ 1, 3, 5 ] ) {
					const turn = turns[ index ];
					expectSameCrop( turn.cropRect, initialCrop );
					expect( turn.zoom ).toBeCloseTo( initialZoom, 6 );
					const output = getOutputSize( turn )!;
					expect( output.width ).toBeCloseTo(
						initialOutput.width,
						6
					);
					expect( output.height ).toBeCloseTo(
						initialOutput.height,
						6
					);
				}
				for ( const index of [ 2, 4 ] ) {
					expectSameCrop(
						turns[ index ].cropRect,
						turns[ 0 ].cropRect
					);
				}
			} );
		}
	}

	it( 'restores a wide crop on a portrait image after two turns', () => {
		let state = imageEditorReducer(
			{ ...DEFAULT_STATE, image: IMAGES[ 1 ] },
			{ type: 'SET_ASPECT_RATIO', payload: 16 / 9 }
		);
		const originalCrop = state.cropRect;
		for ( let i = 0; i < 2; i++ ) {
			state = imageEditorReducer( state, {
				type: 'SNAP_ROTATE_90',
				payload: { direction: -1 },
			} );
		}
		expectSameCrop( state.cropRect, originalCrop );
		expect( state.zoom ).toBeCloseTo( 1, 6 );
	} );

	it( 'restores the maximum crop after fine rotation and two turns', () => {
		let state = imageEditorReducer(
			{ ...DEFAULT_STATE, image: IMAGE },
			{ type: 'SET_ASPECT_RATIO', payload: 16 / 9 }
		);
		state = imageEditorReducer( state, {
			type: 'SET_ROTATION',
			payload: 20,
		} );
		const originalCrop = state.cropRect;
		for ( let i = 0; i < 2; i++ ) {
			state = imageEditorReducer( state, {
				type: 'SNAP_ROTATE_90',
				payload: { direction: 1 },
			} );
		}
		expectSameCrop( state.cropRect, originalCrop );
		expect( state.rotation ).toBe( 200 );
	} );

	it( 'restores the maximum crop at a user-selected zoom after two turns', () => {
		let state = imageEditorReducer(
			{ ...DEFAULT_STATE, image: IMAGE },
			{ type: 'SET_ASPECT_RATIO', payload: 16 / 9 }
		);
		state = imageEditorReducer( state, {
			type: 'SET_ZOOM',
			payload: 2,
		} );
		const originalCrop = state.cropRect;
		for ( let i = 0; i < 2; i++ ) {
			state = imageEditorReducer( state, {
				type: 'SNAP_ROTATE_90',
				payload: { direction: 1 },
			} );
		}
		expect( state.cropRect ).toEqual( originalCrop );
		expect( state.zoom ).toBe( 2 );
	} );

	it( 'keeps a smaller crop through two turns', () => {
		let state = imageEditorReducer(
			{ ...DEFAULT_STATE, image: IMAGE },
			{ type: 'SET_ASPECT_RATIO', payload: 16 / 9 }
		);
		state = imageEditorReducer( state, {
			type: 'SET_CROP_RECT',
			payload: { x: 0.25, y: 0.25, width: 0.5, height: 0.5 },
		} );
		const originalCrop = state.cropRect;
		for ( let i = 0; i < 2; i++ ) {
			state = imageEditorReducer( state, {
				type: 'SNAP_ROTATE_90',
				payload: { direction: 1 },
			} );
		}
		expect( state.cropRect.width ).toBeCloseTo( originalCrop.width );
		expect( state.cropRect.height ).toBeCloseTo( originalCrop.height );
	} );
} );

describe( 'invariants across a run of edits', () => {
	for ( let seed = 1; seed <= 40; seed++ ) {
		it( `holds for 30 edits from seed ${ seed }`, () => {
			const random = makeRandom( seed );
			let state: InternalImageEditorState = {
				...DEFAULT_STATE,
				image: IMAGES[ 0 ],
			};

			const problems: string[] = [];

			for ( let step = 0; step < 30; step++ ) {
				const action = nextAction( random );
				state = imageEditorReducer( state, action );
				const where = `step ${ step }, ${ action.type }`;

				// Nothing may go non-finite, whatever a control sends.
				if ( ! everyNumber( state ).every( Number.isFinite ) ) {
					problems.push( `${ where }: a value is not finite` );
				}

				// A locked ratio means the crop has that ratio.
				const view = viewShape( state );
				if ( state.aspectRatio && view ) {
					const ratio =
						( state.cropRect.width * view.width ) /
						( state.cropRect.height * view.height );
					const offBy = Math.abs( ratio / state.aspectRatio - 1 );
					if ( offBy > RATIO_TOLERANCE ) {
						problems.push(
							`${ where }: crop is off the locked ratio by ${ offBy.toFixed(
								4
							) }`
						);
					}
				}

				// The edit sent for saving has to be something a server
				// can carry out.
				const edit = getImageEdit( state );
				const crop = edit?.crop;
				if (
					crop &&
					! (
						crop.x >= -RATIO_TOLERANCE &&
						crop.y >= -RATIO_TOLERANCE &&
						crop.width > 0 &&
						crop.height > 0 &&
						crop.x + crop.width <= 1 + RATIO_TOLERANCE &&
						crop.y + crop.height <= 1 + RATIO_TOLERANCE
					)
				) {
					problems.push( `${ where }: crop edit is out of bounds` );
				}
				if (
					edit?.rotation !== undefined &&
					! ( edit.rotation >= 0 && edit.rotation < 360 )
				) {
					problems.push(
						`${ where }: rotation is ${ edit.rotation }`
					);
				}

				// Applied to a clean state, so the old view cannot carry
				// the edit.
				if ( edit ) {
					const clean = imageEditorReducer( state, {
						type: 'RESET',
						payload: { aspectRatio: state.aspectRatio },
					} );
					const applied = applyImageEdit( clean, edit );
					if ( 'rejected' in applied ) {
						problems.push(
							`${ where }: its own edit is rejected as ${ applied.rejected }`
						);
					} else if (
						! isSameEdit( getImageEdit( applied.state ), edit )
					) {
						problems.push(
							`${ where }: its own edit reads back differently`
						);
					}
				}
			}

			expect( problems ).toEqual( [] );
		} );
	}
} );
