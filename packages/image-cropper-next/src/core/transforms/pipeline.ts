/**
 * Internal dependencies
 */
import type { TransformOperation, CropperState } from '../types';
import { DEFAULT_STATE } from '../constants';
import { normalizeRotation } from '../math/rotation';

/**
 * Valid operation type strings for deserialization validation.
 */
const VALID_OPERATION_TYPES = new Set< string >( [
	'crop',
	'rotate',
	'flip',
	'zoom',
] );

/**
 * Create an empty transform pipeline.
 *
 * @return An empty array of transform operations.
 */
export function createPipeline(): TransformOperation[] {
	return [];
}

/**
 * Immutably append an operation to the pipeline.
 *
 * @param pipeline - The existing pipeline.
 * @param op       - The operation to append.
 * @return A new pipeline array with the operation appended.
 */
export function addOperation(
	pipeline: TransformOperation[],
	op: TransformOperation
): TransformOperation[] {
	return [ ...pipeline, op ];
}

/**
 * Apply a single transform operation to a cropper state, returning a new state.
 * This is the core state transition function for the non-destructive pipeline.
 *
 * @param state - The current cropper state.
 * @param op    - The operation to apply.
 * @return A new cropper state with the operation applied.
 */
export function applyOperationToState(
	state: CropperState,
	op: TransformOperation
): CropperState {
	switch ( op.type ) {
		case 'crop':
			return {
				...state,
				cropRect: { ...op.rect },
			};

		case 'rotate':
			return {
				...state,
				rotation: normalizeRotation( state.rotation + op.degrees ),
			};

		case 'flip':
			return {
				...state,
				flip: {
					...state.flip,
					[ op.direction ]: ! state.flip[ op.direction ],
				},
			};

		case 'zoom':
			return {
				...state,
				zoom: op.factor,
			};
	}
}

/**
 * Replay all operations from an initial state to produce the final state.
 *
 * @param pipeline     - The array of transform operations to replay.
 * @param initialState - The starting state. Defaults to DEFAULT_STATE.
 * @return The resulting cropper state after all operations are applied.
 */
export function stateFromPipeline(
	pipeline: TransformOperation[],
	initialState: CropperState = { ...DEFAULT_STATE }
): CropperState {
	return pipeline.reduce(
		( state, op ) => applyOperationToState( state, op ),
		initialState
	);
}

/**
 * Serialize a pipeline to a JSON string.
 *
 * @param pipeline - The pipeline to serialize.
 * @return A JSON string representation of the pipeline.
 */
export function serializePipeline( pipeline: TransformOperation[] ): string {
	return JSON.stringify( pipeline );
}

/**
 * Deserialize a pipeline from a JSON string, with validation.
 *
 * @param  json - The JSON string to parse.
 * @return The deserialized array of transform operations.
 * @throws {Error} If the input is not valid JSON, not an array, or contains operations with invalid type fields.
 */
export function deserializePipeline( json: string ): TransformOperation[] {
	let parsed: unknown;

	try {
		parsed = JSON.parse( json );
	} catch {
		throw new Error(
			'Invalid pipeline JSON: input is not a valid JSON string.'
		);
	}

	if ( ! Array.isArray( parsed ) ) {
		throw new Error(
			'Invalid pipeline JSON: expected an array of operations.'
		);
	}

	for ( let i = 0; i < parsed.length; i++ ) {
		const item = parsed[ i ];
		if (
			typeof item !== 'object' ||
			item === null ||
			typeof item.type !== 'string' ||
			! VALID_OPERATION_TYPES.has( item.type )
		) {
			throw new Error(
				`Invalid pipeline JSON: operation at index ${ i } has an invalid or missing "type" field.`
			);
		}
	}

	return parsed as TransformOperation[];
}
