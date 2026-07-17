/**
 * Internal dependencies
 */
import type { CropperState, TransformOperation } from '../../types';
import { DEFAULT_STATE } from '../../constants';
import { applyOperationToState, stateFromPipeline } from '../pipeline';
import { cropperReducer } from '../../state';

describe( 'applyOperationToState', () => {
	let baseState: CropperState;

	beforeEach( () => {
		baseState = {
			...DEFAULT_STATE,
			flip: { ...DEFAULT_STATE.flip },
			pan: { ...DEFAULT_STATE.pan },
			cropRect: { ...DEFAULT_STATE.cropRect },
		};
	} );

	it( 'should handle crop: set cropRect', () => {
		const result = applyOperationToState( baseState, {
			type: 'crop',
			rect: { x: 0.1, y: 0.2, width: 0.5, height: 0.6 },
		} );

		expect( result.cropRect ).toEqual( {
			x: 0.1,
			y: 0.2,
			width: 0.5,
			height: 0.6,
		} );
	} );

	it( 'should handle rotate: add degrees and normalize', () => {
		const result = applyOperationToState( baseState, {
			type: 'rotate',
			degrees: 90,
		} );

		expect( result.rotation ).toBe( 90 );
	} );

	it( 'should handle rotate: accumulate and normalize past 360', () => {
		let state = applyOperationToState( baseState, {
			type: 'rotate',
			degrees: 270,
		} );
		state = applyOperationToState( state, {
			type: 'rotate',
			degrees: 180,
		} );

		// 270 + 180 = 450 -> 90 (normalized)
		expect( state.rotation ).toBe( 90 );
	} );

	it( 'should handle rotate: negative degrees normalize correctly', () => {
		const result = applyOperationToState( baseState, {
			type: 'rotate',
			degrees: -90,
		} );

		expect( result.rotation ).toBe( 270 );
	} );

	it( 'should handle flip horizontal: toggle on', () => {
		const result = applyOperationToState( baseState, {
			type: 'flip',
			direction: 'horizontal',
		} );

		expect( result.flip.horizontal ).toBe( true );
		expect( result.flip.vertical ).toBe( false );
	} );

	it( 'should handle flip horizontal: toggle off', () => {
		const flippedState: CropperState = {
			...baseState,
			flip: { horizontal: true, vertical: false },
		};

		const result = applyOperationToState( flippedState, {
			type: 'flip',
			direction: 'horizontal',
		} );

		expect( result.flip.horizontal ).toBe( false );
		expect( result.flip.vertical ).toBe( false );
	} );

	it( 'should handle flip vertical: toggle on', () => {
		const result = applyOperationToState( baseState, {
			type: 'flip',
			direction: 'vertical',
		} );

		expect( result.flip.horizontal ).toBe( false );
		expect( result.flip.vertical ).toBe( true );
	} );

	it( 'should handle zoom: set zoom factor', () => {
		const result = applyOperationToState( baseState, {
			type: 'zoom',
			factor: 3.5,
		} );

		expect( result.zoom ).toBe( 3.5 );
	} );

	it( 'should not mutate the original state', () => {
		const original = { ...baseState };
		applyOperationToState( baseState, {
			type: 'rotate',
			degrees: 90,
		} );

		expect( baseState.rotation ).toBe( original.rotation );
	} );
} );

describe( 'stateFromPipeline', () => {
	it( 'should return default state for an empty pipeline', () => {
		const result = stateFromPipeline( [] );
		expect( result.rotation ).toBe( 0 );
		expect( result.zoom ).toBe( 1 );
		expect( result.flip ).toEqual( { horizontal: false, vertical: false } );
	} );

	it( 'should apply a sequence of operations correctly', () => {
		const pipeline: TransformOperation[] = [
			{ type: 'rotate', degrees: 45 },
			{ type: 'flip', direction: 'horizontal' },
			{ type: 'zoom', factor: 2 },
			{
				type: 'crop',
				rect: { x: 0.25, y: 0.25, width: 0.5, height: 0.5 },
			},
		];

		const result = stateFromPipeline( pipeline );

		expect( result.rotation ).toBe( 45 );
		expect( result.flip.horizontal ).toBe( true );
		expect( result.flip.vertical ).toBe( false );
		expect( result.zoom ).toBe( 2 );
		expect( result.cropRect ).toEqual( {
			x: 0.25,
			y: 0.25,
			width: 0.5,
			height: 0.5,
		} );
	} );

	it( 'should use custom initial state when provided', () => {
		// The custom initial represents a user who committed to this
		// pose via UI actions. Sync base fields so the pipeline replay
		// (which routes through the reducer) doesn't relax them.
		const customInitial: CropperState = {
			...DEFAULT_STATE,
			rotation: 90,
			baseRotation: 90,
			zoom: 2,
			baseZoom: 2,
			flip: { horizontal: true, vertical: false },
			pan: { ...DEFAULT_STATE.pan },
			basePan: { ...DEFAULT_STATE.pan },
			cropRect: { ...DEFAULT_STATE.cropRect },
		};

		const pipeline: TransformOperation[] = [
			{ type: 'rotate', degrees: 90 },
		];

		const result = stateFromPipeline( pipeline, customInitial );

		// Single-axis flip is active, so `degrees: 90` (visual CW) is
		// applied as -90° to the rotation field: 90 − 90 = 0.
		expect( result.rotation ).toBe( 0 );
		// Other state should carry forward.
		expect( result.zoom ).toBe( 2 );
		expect( result.flip.horizontal ).toBe( true );
	} );
} );

describe( 'pipeline / reducer parity', () => {
	// These tests pin the API parity contract: applying a pipeline op
	// via applyOperationToState and dispatching the equivalent reducer
	// action should produce the same bounded state.
	const stateWithImage = {
		...DEFAULT_STATE,
		image: {
			src: 'test.jpg',
			naturalWidth: 1600,
			naturalHeight: 900,
		},
	};

	it( 'rotate op matches SET_ROTATION (absolute angle)', () => {
		const pipelineResult = applyOperationToState( stateWithImage, {
			type: 'rotate',
			degrees: 30,
		} );
		// Pipeline op is additive, reducer action is absolute, so use
		// the resolved absolute angle in the reducer call.
		const reducerResult = cropperReducer( stateWithImage, {
			type: 'SET_ROTATION',
			payload: 30,
		} );
		expect( pipelineResult.rotation ).toBe( reducerResult.rotation );
		expect( pipelineResult.zoom ).toBe( reducerResult.zoom );
		expect( pipelineResult.pan.x ).toBeCloseTo( reducerResult.pan.x, 6 );
		expect( pipelineResult.pan.y ).toBeCloseTo( reducerResult.pan.y, 6 );
	} );

	it( 'zoom op matches SET_ZOOM', () => {
		const pipelineResult = applyOperationToState( stateWithImage, {
			type: 'zoom',
			factor: 3,
		} );
		const reducerResult = cropperReducer( stateWithImage, {
			type: 'SET_ZOOM',
			payload: 3,
		} );
		expect( pipelineResult.zoom ).toBe( reducerResult.zoom );
		expect( pipelineResult.baseZoom ).toBe( reducerResult.baseZoom );
	} );

	it( 'flip op matches SET_FLIP', () => {
		const pipelineResult = applyOperationToState( stateWithImage, {
			type: 'flip',
			direction: 'horizontal',
		} );
		const reducerResult = cropperReducer( stateWithImage, {
			type: 'SET_FLIP',
			payload: { horizontal: true, vertical: false },
		} );
		expect( pipelineResult.flip ).toEqual( reducerResult.flip );
	} );

	it( 'crop op matches SET_CROP_RECT', () => {
		const rect = { x: 0.1, y: 0.1, width: 0.4, height: 0.4 };
		const pipelineResult = applyOperationToState( stateWithImage, {
			type: 'crop',
			rect,
		} );
		const reducerResult = cropperReducer( stateWithImage, {
			type: 'SET_CROP_RECT',
			payload: rect,
		} );
		expect( pipelineResult.cropRect ).toEqual( reducerResult.cropRect );
		expect( pipelineResult.zoom ).toBe( reducerResult.zoom );
	} );

	it( 'rotate op: degrees means visual CW, negated on single-axis flip', () => {
		// `{ type: 'rotate', degrees: 90 }` means "90° clockwise visually".
		// On a single-flipped image the rotation field must go the other
		// way to achieve that visual outcome — matching snapRotate90.
		const flippedState = {
			...stateWithImage,
			flip: { horizontal: true, vertical: false },
		};
		const result = applyOperationToState( flippedState, {
			type: 'rotate',
			degrees: 90,
		} );
		expect( result.rotation ).toBe( 270 );
	} );
} );
