/**
 * Internal dependencies
 */
import { isCropVisuallyUnreachable } from '../crop-reachability';
import type { Size } from '../../../core/types';

const CANVAS_SIZE: Size = { width: 600, height: 400 };
const IMAGE_SIZE: Size = { width: 600, height: 400 };
const ZERO_PAN = { x: 0, y: 0 };

describe( 'isCropVisuallyUnreachable', () => {
	it( 'returns true when the crop is fully outside the visible canvas', () => {
		expect(
			isCropVisuallyUnreachable(
				{ x: 2, y: 0.25, width: 0.5, height: 0.5 },
				CANVAS_SIZE,
				IMAGE_SIZE,
				ZERO_PAN
			)
		).toBe( true );
	} );

	it( 'returns true when only a sliver of a large crop is visible', () => {
		expect(
			isCropVisuallyUnreachable(
				{ x: -0.48, y: 0.25, width: 0.5, height: 0.5 },
				CANVAS_SIZE,
				IMAGE_SIZE,
				ZERO_PAN
			)
		).toBe( true );
	} );

	it( 'returns false for visible crops near the canvas edge', () => {
		expect(
			isCropVisuallyUnreachable(
				{ x: -0.02, y: 0.25, width: 0.5, height: 0.5 },
				CANVAS_SIZE,
				IMAGE_SIZE,
				ZERO_PAN
			)
		).toBe( false );
	} );

	it( 'returns false for tiny but fully visible crops', () => {
		expect(
			isCropVisuallyUnreachable(
				{ x: 0.5, y: 0.5, width: 0.01, height: 0.01 },
				CANVAS_SIZE,
				IMAGE_SIZE,
				ZERO_PAN
			)
		).toBe( false );
	} );

	it( 'includes transient viewport pan when checking visibility', () => {
		expect(
			isCropVisuallyUnreachable(
				{ x: 0.25, y: 0.25, width: 0.5, height: 0.5 },
				CANVAS_SIZE,
				IMAGE_SIZE,
				{ x: -1000, y: 0 }
			)
		).toBe( true );
	} );

	it( 'returns false until the canvas and image have measurable dimensions', () => {
		expect(
			isCropVisuallyUnreachable(
				{ x: 2, y: 0.25, width: 0.5, height: 0.5 },
				{ width: 0, height: 400 },
				IMAGE_SIZE,
				ZERO_PAN
			)
		).toBe( false );
	} );
} );
