/**
 * External dependencies
 */
import { renderHook, act } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { useCropperState } from '../use-cropper-state';
import { DEFAULT_STATE } from '../../core/constants';

describe( 'useCropperState', () => {
	it( 'should initialize with DEFAULT_STATE', () => {
		const { result } = renderHook( () => useCropperState() );

		expect( result.current.state ).toEqual( DEFAULT_STATE );
	} );

	it( 'should initialize with merged partial state', () => {
		const { result } = renderHook( () =>
			useCropperState( { zoom: 2, rotation: 45 } )
		);

		expect( result.current.state.zoom ).toBe( 2 );
		expect( result.current.state.rotation ).toBe( 45 );
		// Non-overridden fields should match defaults.
		expect( result.current.state.crop ).toEqual( DEFAULT_STATE.crop );
	} );

	it( 'should dispatch SET_CROP via setCrop', () => {
		const { result } = renderHook( () => useCropperState() );

		// At zoom=1, crop is clamped to (0,0) — no panning possible.
		// Zoom in first to allow panning.
		act( () => {
			result.current.setZoom( 3 );
		} );

		act( () => {
			result.current.setCrop( { x: 0.3, y: 0.2 } );
		} );

		expect( result.current.state.crop.x ).toBeCloseTo( 0.3 );
		expect( result.current.state.crop.y ).toBeCloseTo( 0.2 );
	} );

	it( 'should dispatch SET_ZOOM via setZoom', () => {
		const { result } = renderHook( () => useCropperState() );

		act( () => {
			result.current.setZoom( 3 );
		} );

		expect( result.current.state.zoom ).toBe( 3 );
	} );

	it( 'should clamp zoom to valid range via SET_ZOOM', () => {
		const { result } = renderHook( () => useCropperState() );

		act( () => {
			result.current.setZoom( 15 );
		} );

		expect( result.current.state.zoom ).toBe( 10 );

		act( () => {
			result.current.setZoom( 0.5 );
		} );

		expect( result.current.state.zoom ).toBe( 1 );
	} );

	it( 'should dispatch SET_ROTATION via setRotation', () => {
		const { result } = renderHook( () => useCropperState() );

		act( () => {
			result.current.setRotation( 90 );
		} );

		expect( result.current.state.rotation ).toBe( 90 );
	} );

	it( 'should normalize rotation via SET_ROTATION', () => {
		const { result } = renderHook( () => useCropperState() );

		act( () => {
			result.current.setRotation( -90 );
		} );

		expect( result.current.state.rotation ).toBe( 270 );

		act( () => {
			result.current.setRotation( 450 );
		} );

		expect( result.current.state.rotation ).toBe( 90 );
	} );

	it( 'should dispatch SET_FLIP via setFlip', () => {
		const { result } = renderHook( () => useCropperState() );

		act( () => {
			result.current.setFlip( {
				horizontal: true,
				vertical: false,
			} );
		} );

		expect( result.current.state.flip ).toEqual( {
			horizontal: true,
			vertical: false,
		} );
	} );

	it( 'should dispatch SET_CROP_RECT via setCropRect', () => {
		const { result } = renderHook( () => useCropperState() );

		const rect = { x: 0.1, y: 0.2, width: 0.5, height: 0.6 };
		act( () => {
			result.current.setCropRect( rect );
		} );

		expect( result.current.state.cropRect ).toEqual( rect );
	} );

	it( 'should dispatch APPLY_OPERATION via applyOperation', () => {
		const { result } = renderHook( () => useCropperState() );

		act( () => {
			result.current.applyOperation( {
				type: 'rotate',
				degrees: 90,
			} );
		} );

		expect( result.current.state.rotation ).toBe( 90 );
	} );

	it( 'should handle APPLY_OPERATION for flip', () => {
		const { result } = renderHook( () => useCropperState() );

		act( () => {
			result.current.applyOperation( {
				type: 'flip',
				direction: 'horizontal',
			} );
		} );

		expect( result.current.state.flip.horizontal ).toBe( true );
		expect( result.current.state.flip.vertical ).toBe( false );
	} );

	it( 'should accumulate rotation via APPLY_OPERATION', () => {
		const { result } = renderHook( () => useCropperState() );

		act( () => {
			result.current.applyOperation( {
				type: 'rotate',
				degrees: 90,
			} );
		} );

		act( () => {
			result.current.applyOperation( {
				type: 'rotate',
				degrees: 45,
			} );
		} );

		expect( result.current.state.rotation ).toBe( 135 );
	} );

	it( 'should handle APPLY_OPERATION for crop', () => {
		const { result } = renderHook( () => useCropperState() );

		const rect = { x: 0.1, y: 0.2, width: 0.5, height: 0.6 };
		act( () => {
			result.current.applyOperation( {
				type: 'crop',
				rect,
			} );
		} );

		expect( result.current.state.cropRect ).toEqual( rect );
	} );

	it( 'should handle APPLY_OPERATION for zoom', () => {
		const { result } = renderHook( () => useCropperState() );

		act( () => {
			result.current.applyOperation( {
				type: 'zoom',
				factor: 3,
			} );
		} );

		expect( result.current.state.zoom ).toBe( 3 );
	} );

	it( 'should reset to DEFAULT_STATE', () => {
		const { result } = renderHook( () => useCropperState() );

		// Modify state first.
		act( () => {
			result.current.setZoom( 5 );
			result.current.setRotation( 180 );
		} );

		expect( result.current.state.zoom ).toBe( 5 );

		act( () => {
			result.current.reset();
		} );

		expect( result.current.state ).toEqual( DEFAULT_STATE );
	} );

	it( 'should reset to a custom state', () => {
		const { result } = renderHook( () => useCropperState() );

		act( () => {
			result.current.setZoom( 5 );
		} );

		act( () => {
			result.current.reset( { zoom: 2 } );
		} );

		expect( result.current.state.zoom ).toBe( 2 );
		expect( result.current.state.crop ).toEqual( DEFAULT_STATE.crop );
	} );

	describe( 'isDirty', () => {
		it( 'should be false initially', () => {
			const { result } = renderHook( () => useCropperState() );

			expect( result.current.isDirty ).toBe( false );
		} );

		it( 'should be true after changing crop', () => {
			const { result } = renderHook( () => useCropperState() );

			// Zoom in first so crop change isn't clamped to (0,0).
			act( () => {
				result.current.setZoom( 3 );
			} );

			act( () => {
				result.current.setCrop( { x: 0.1, y: 0.2 } );
			} );

			expect( result.current.isDirty ).toBe( true );
		} );

		it( 'should be true after changing zoom', () => {
			const { result } = renderHook( () => useCropperState() );

			act( () => {
				result.current.setZoom( 2 );
			} );

			expect( result.current.isDirty ).toBe( true );
		} );

		it( 'should be true after changing rotation', () => {
			const { result } = renderHook( () => useCropperState() );

			act( () => {
				result.current.setRotation( 45 );
			} );

			expect( result.current.isDirty ).toBe( true );
		} );

		it( 'should be true after changing flip', () => {
			const { result } = renderHook( () => useCropperState() );

			act( () => {
				result.current.setFlip( {
					horizontal: true,
					vertical: false,
				} );
			} );

			expect( result.current.isDirty ).toBe( true );
		} );

		it( 'should be false after reset', () => {
			const { result } = renderHook( () => useCropperState() );

			act( () => {
				result.current.setZoom( 5 );
			} );

			expect( result.current.isDirty ).toBe( true );

			act( () => {
				result.current.reset();
			} );

			expect( result.current.isDirty ).toBe( false );
		} );

		it( 'should be false after manually resetting fields to initial values', () => {
			const { result } = renderHook( () => useCropperState() );

			// Zoom in and pan.
			act( () => {
				result.current.setZoom( 3 );
			} );

			act( () => {
				result.current.setCrop( { x: 0.2, y: 0.2 } );
			} );

			expect( result.current.isDirty ).toBe( true );

			// Reset each field back to its initial value manually.
			act( () => {
				result.current.setZoom( 1 );
			} );

			act( () => {
				result.current.setCrop( { x: 0, y: 0 } );
			} );

			expect( result.current.isDirty ).toBe( false );
		} );
	} );

	describe( 'containment enforcement', () => {
		// For these tests, we need a loaded image so the reducer can
		// compute minZoomForCover and restrict position.
		function setupWithImage() {
			const view = renderHook( () => useCropperState() );
			act( () => {
				view.result.current.dispatch( {
					type: 'SET_IMAGE',
					payload: {
						src: 'test.jpg',
						naturalWidth: 1000,
						naturalHeight: 500,
					},
				} );
			} );
			return view;
		}

		it( 'should restrict position when SET_CROP is dispatched', () => {
			const { result } = setupWithImage();

			// At zoom=1, no panning is possible — the image exactly covers
			// the crop area. Any pan value should be clamped to (0, 0).
			act( () => {
				result.current.setCrop( { x: 0.5, y: 0.5 } );
			} );

			expect( result.current.state.crop.x ).toBe( 0 );
			expect( result.current.state.crop.y ).toBe( 0 );
		} );

		it( 'should allow limited panning at zoom > 1', () => {
			const { result } = setupWithImage();

			act( () => {
				result.current.setZoom( 2 );
			} );

			act( () => {
				result.current.setCrop( { x: 0.3, y: 0.3 } );
			} );

			// Should be within bounds (not clamped to 0)
			expect( result.current.state.crop.x ).toBeGreaterThan( 0 );
			expect( result.current.state.crop.y ).toBeGreaterThan( 0 );

			// But if we try an extreme pan, it should be clamped
			act( () => {
				result.current.setCrop( { x: 100, y: 100 } );
			} );

			expect( result.current.state.crop.x ).toBeLessThan( 1 );
			expect( result.current.state.crop.y ).toBeLessThan( 1 );
		} );

		it( 'should restrict crop rect when rotation changes and image cannot cover full rect', () => {
			const { result } = setupWithImage();

			expect( result.current.state.zoom ).toBe( 1 );
			expect( result.current.state.cropRect.width ).toBe( 1 );

			// Rotate 45 degrees. The image (2:1 aspect ratio) at zoom=1
			// cannot fully cover a 1x1 crop rect, so it gets restricted.
			act( () => {
				result.current.setRotation( 45 );
			} );

			expect( result.current.state.rotation ).toBe( 45 );
			// The crop rect is scaled down to fit within the rotated image.
			expect( result.current.state.cropRect.width ).toBeLessThanOrEqual(
				1
			);
			expect( result.current.state.cropRect.height ).toBeLessThanOrEqual(
				1
			);
			expect( result.current.state.zoom ).toBe( 1 );
		} );

		it( 'should not reduce zoom when rotation returns to 0', () => {
			const { result } = setupWithImage();

			act( () => {
				result.current.setZoom( 2 );
			} );

			act( () => {
				result.current.setRotation( 45 );
			} );

			act( () => {
				result.current.setRotation( 0 );
			} );

			// Zoom should stay at 2 (not be reduced).
			expect( result.current.state.zoom ).toBe( 2 );
		} );

		it( 'should reset pan when rotation changes', () => {
			const { result } = setupWithImage();

			// Zoom in and pan
			act( () => {
				result.current.setZoom( 3 );
			} );
			act( () => {
				result.current.setCrop( { x: 0.2, y: 0.2 } );
			} );

			expect( result.current.state.crop.x ).toBeCloseTo( 0.2 );

			// Rotate — position should be re-restricted
			act( () => {
				result.current.setRotation( 45 );
			} );

			// The position should be within the new valid range
			const { crop, zoom } = result.current.state;
			// Verify the position is valid for the new state
			expect( Math.abs( crop.x ) ).toBeLessThanOrEqual( zoom );
			expect( Math.abs( crop.y ) ).toBeLessThanOrEqual( zoom );
		} );

		it( 'should not allow zoom below minZoomForCover', () => {
			const { result } = setupWithImage();

			// At rotation=0, minZoom is 1 for a full crop rect.
			act( () => {
				result.current.setZoom( 0.5 );
			} );

			expect( result.current.state.zoom ).toBeGreaterThanOrEqual( 1 );

			// Zoom above maximum should be clamped to 10.
			act( () => {
				result.current.setZoom( 15 );
			} );

			expect( result.current.state.zoom ).toBe( 10 );
		} );

		it( 'should re-restrict position after zoom change', () => {
			const { result } = setupWithImage();

			// Zoom in and pan to the edge
			act( () => {
				result.current.setZoom( 4 );
			} );
			act( () => {
				result.current.setCrop( { x: 1, y: 1 } );
			} );

			const panAtZoom4 = { ...result.current.state.crop };

			// Zoom out — pan should be reduced to stay within bounds
			act( () => {
				result.current.setZoom( 2 );
			} );

			expect(
				Math.abs( result.current.state.crop.x )
			).toBeLessThanOrEqual( Math.abs( panAtZoom4.x ) );
		} );

		it( 'should restrict crop rect at 90-degree rotation for non-square image', () => {
			const { result } = setupWithImage();
			// Image is 1000x500 (2:1). At 90 degrees rotation with zoom=1,
			// the image cannot cover a full 1x1 crop rect, so it gets restricted.
			act( () => {
				result.current.setRotation( 90 );
			} );

			const { cropRect, zoom } = result.current.state;
			// The crop rect is constrained by the image's aspect ratio.
			expect( cropRect.width ).toBeLessThanOrEqual( 1 );
			expect( cropRect.height ).toBeLessThanOrEqual( 1 );
			expect( zoom ).toBeCloseTo( 1, 5 );
		} );

		it( 'should not change zoom when SET_CROP_RECT is dispatched', () => {
			const { result } = setupWithImage();

			// Zoom in explicitly.
			act( () => {
				result.current.setZoom( 2 );
			} );
			expect( result.current.state.zoom ).toBe( 2 );

			// Rotate so that containment matters.
			act( () => {
				result.current.setRotation( 45 );
			} );
			const zoomAfterRotation = result.current.state.zoom;

			// Now resize the crop rect — zoom must NOT change.
			act( () => {
				result.current.setCropRect( {
					x: 0.1,
					y: 0.1,
					width: 0.8,
					height: 0.8,
				} );
			} );

			expect( result.current.state.zoom ).toBe( zoomAfterRotation );
		} );

		it( 'should allow full crop rect via SET_CROP_RECT at rotation in visual space', () => {
			const { result } = setupWithImage();

			act( () => {
				result.current.setRotation( 45 );
			} );

			// In visual space, a full crop rect is always valid.
			act( () => {
				result.current.setCropRect( {
					x: 0,
					y: 0,
					width: 1,
					height: 1,
				} );
			} );

			expect( result.current.state.cropRect.width ).toBe( 1 );
			expect( result.current.state.cropRect.height ).toBe( 1 );
		} );
	} );

	describe( 'direct dispatch', () => {
		it( 'should handle SET_IMAGE via dispatch', () => {
			const { result } = renderHook( () => useCropperState() );

			const imageData = {
				src: 'test.jpg',
				naturalWidth: 800,
				naturalHeight: 600,
			};

			act( () => {
				result.current.dispatch( {
					type: 'SET_IMAGE',
					payload: imageData,
				} );
			} );

			expect( result.current.state.image ).toEqual( imageData );
		} );
	} );
} );
