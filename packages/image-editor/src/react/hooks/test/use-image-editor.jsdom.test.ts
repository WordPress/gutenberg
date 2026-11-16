import { describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRef, useState } from '@wordpress/element';
import {
	createImageEditorState,
	useInternalImageEditor,
} from '../use-image-editor';
import type { InternalImageEditorState } from '../../../core/types';
import { DEFAULT_STATE } from '../../../core/constants';
import { computeInscribedRect } from '../../../core/crop-rect';

describe( 'useInternalImageEditor', () => {
	it( 'should initialize with DEFAULT_STATE', () => {
		const { result } = renderHook( () => useInternalImageEditor() );

		expect( result.current.state ).toEqual( DEFAULT_STATE );
	} );

	it( 'should initialize with merged partial state', () => {
		const { result } = renderHook( () =>
			useInternalImageEditor( {
				initialState: { zoom: 2, rotation: 45 },
			} )
		);

		expect( result.current.state.zoom ).toBe( 2 );
		expect( result.current.state.rotation ).toBe( 45 );
		// Non-overridden fields should match defaults.
		expect( result.current.state.pan ).toEqual( DEFAULT_STATE.pan );
	} );

	it( 'should dispatch SET_CROP via setCrop', () => {
		const { result } = renderHook( () => useInternalImageEditor() );

		// At zoom=1, crop is clamped to (0,0) — no panning possible.
		// Zoom in first to allow panning.
		act( () => {
			result.current.setZoom( 3 );
		} );

		act( () => {
			result.current.setPan( { x: 0.3, y: 0.2 } );
		} );

		expect( result.current.state.pan.x ).toBeCloseTo( 0.3 );
		expect( result.current.state.pan.y ).toBeCloseTo( 0.2 );
	} );

	it( 'should dispatch SET_ZOOM via setZoom', () => {
		const { result } = renderHook( () => useInternalImageEditor() );

		act( () => {
			result.current.setZoom( 3 );
		} );

		expect( result.current.state.zoom ).toBe( 3 );
	} );

	it( 'leaves pan at zero on setZoom when the cropRect is centered', () => {
		// Sanity: the default cropRect spans the full image, so its
		// center coincides with the image center and the crop-center
		// focal-point correction degenerates to "no pan change."
		// Guards against regressions where setZoom accidentally pans.
		const { result } = renderHook( () => useInternalImageEditor() );

		act( () => {
			result.current.setZoom( 4 );
		} );

		expect( result.current.state.zoom ).toBe( 4 );
		expect( result.current.state.pan ).toEqual( { x: 0, y: 0 } );

		act( () => {
			result.current.setZoom( 2 );
		} );

		expect( result.current.state.zoom ).toBe( 2 );
		expect( result.current.state.pan ).toEqual( { x: 0, y: 0 } );
	} );

	it( 'anchors setZoom at the crop-rect center', () => {
		// With an off-center crop, setZoom must shift pan toward the
		// crop center as zoom decreases — otherwise `enforceContainment`
		// would translate the image toward the nearest viewport corner
		// (the original bug this method fixes).
		const { result } = renderHook( () => useInternalImageEditor() );

		act( () => {
			result.current.setZoom( 4 );
		} );
		// Place the crop in the bottom-right quadrant — center
		// at ( 0.7, 0.7 ), i.e. ( +0.2, +0.2 ) in pan coords.
		act( () => {
			result.current.setCropRect( {
				x: 0.6,
				y: 0.6,
				width: 0.2,
				height: 0.2,
			} );
		} );
		act( () => {
			result.current.setPan( { x: 0, y: 0 } );
		} );

		expect( result.current.state.pan ).toEqual( { x: 0, y: 0 } );

		// Zoom out — pan should move toward the focal point in +x, +y,
		// not stay at the origin (which would corner-snap on containment).
		act( () => {
			result.current.setZoom( 2 );
		} );

		expect( result.current.state.zoom ).toBe( 2 );
		expect( result.current.state.pan.x ).toBeGreaterThan( 0 );
		expect( result.current.state.pan.y ).toBeGreaterThan( 0 );
	} );

	it( 'should dispatch SET_ZOOM_AT_POINT via setZoomAtPoint', () => {
		const { result } = renderHook( () => useInternalImageEditor() );

		act( () => {
			result.current.setZoomAtPoint( 3, { x: 0.2, y: 0.1 } );
		} );

		expect( result.current.state.zoom ).toBe( 3 );
		expect( result.current.state.pan ).toEqual( { x: 0.2, y: 0.1 } );
	} );

	it( 'should clamp zoom to valid range via SET_ZOOM', () => {
		const { result } = renderHook( () => useInternalImageEditor() );

		act( () => {
			result.current.setZoom( 15 );
		} );

		expect( result.current.state.zoom ).toBe( 10 );

		act( () => {
			result.current.setZoom( 0.5 );
		} );

		expect( result.current.state.zoom ).toBe( 1 );
	} );

	it( 'allows setZoom below 1 when the coverage minimum permits', () => {
		// Thin, fine-rotated crop on a portrait image: the coverage
		// minimum drops below 1, so `setZoom` (slider / keyboard path)
		// must honour values below 1 rather than clamping at MIN_ZOOM.
		const { result } = renderHook( () =>
			useInternalImageEditor( {
				initialState: {
					image: {
						src: 'portrait.jpg',
						naturalWidth: 900,
						naturalHeight: 1600,
					},
					rotation: 19,
					cropRect: { x: 0.48, y: 0, width: 0.04, height: 1 },
				},
			} )
		);

		act( () => {
			result.current.setZoom( 0.9 );
		} );

		expect( result.current.state.zoom ).toBeLessThan( 1 );
		expect( result.current.state.zoom ).toBeGreaterThanOrEqual( 0.9 );
	} );

	it( 'should dispatch SET_ROTATION via setRotation', () => {
		const { result } = renderHook( () => useInternalImageEditor() );

		act( () => {
			result.current.setRotation( 90 );
		} );

		expect( result.current.state.rotation ).toBe( 90 );
	} );

	it( 'should normalize rotation via SET_ROTATION', () => {
		const { result } = renderHook( () => useInternalImageEditor() );

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
		const { result } = renderHook( () => useInternalImageEditor() );

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

	it( 'toggleFlip should toggle horizontal flip', () => {
		const { result } = renderHook( () => useInternalImageEditor() );

		act( () => {
			result.current.toggleFlip( 'horizontal' );
		} );

		expect( result.current.state.flip ).toEqual( {
			horizontal: true,
			vertical: false,
		} );

		act( () => {
			result.current.toggleFlip( 'horizontal' );
		} );

		expect( result.current.state.flip ).toEqual( {
			horizontal: false,
			vertical: false,
		} );
	} );

	it( 'toggleFlip should toggle vertical flip independently', () => {
		const { result } = renderHook( () => useInternalImageEditor() );

		act( () => {
			result.current.toggleFlip( 'vertical' );
		} );

		expect( result.current.state.flip ).toEqual( {
			horizontal: false,
			vertical: true,
		} );
	} );

	it( 'should dispatch SET_CROP_RECT via setCropRect', () => {
		const { result } = renderHook( () => useInternalImageEditor() );

		const rect = { x: 0.1, y: 0.2, width: 0.5, height: 0.6 };
		act( () => {
			result.current.setCropRect( rect );
		} );

		expect( result.current.state.cropRect ).toEqual( rect );
	} );

	it( 'should reset to DEFAULT_STATE', () => {
		const { result } = renderHook( () => useInternalImageEditor() );

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
		const { result } = renderHook( () => useInternalImageEditor() );

		act( () => {
			result.current.setZoom( 5 );
		} );

		act( () => {
			result.current.reset( { zoom: 2 } );
		} );

		expect( result.current.state.zoom ).toBe( 2 );
		expect( result.current.state.pan ).toEqual( DEFAULT_STATE.pan );
	} );

	describe( 'isDirty', () => {
		it( 'should be false initially', () => {
			const { result } = renderHook( () => useInternalImageEditor() );

			expect( result.current.isDirty ).toBe( false );
		} );

		it( 'should be true after changing crop', () => {
			const { result } = renderHook( () => useInternalImageEditor() );

			// Zoom in first so crop change isn't clamped to (0,0).
			act( () => {
				result.current.setZoom( 3 );
			} );

			act( () => {
				result.current.setPan( { x: 0.1, y: 0.2 } );
			} );

			expect( result.current.isDirty ).toBe( true );
		} );

		it( 'should be true after changing zoom', () => {
			const { result } = renderHook( () => useInternalImageEditor() );

			act( () => {
				result.current.setZoom( 2 );
			} );

			expect( result.current.isDirty ).toBe( true );
		} );

		it( 'should be true after changing rotation', () => {
			const { result } = renderHook( () => useInternalImageEditor() );

			act( () => {
				result.current.setRotation( 45 );
			} );

			expect( result.current.isDirty ).toBe( true );
		} );

		it( 'should be true after changing flip', () => {
			const { result } = renderHook( () => useInternalImageEditor() );

			act( () => {
				result.current.setFlip( {
					horizontal: true,
					vertical: false,
				} );
			} );

			expect( result.current.isDirty ).toBe( true );
		} );

		it( 'should be false after reset', () => {
			const { result } = renderHook( () => useInternalImageEditor() );

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
			const { result } = renderHook( () => useInternalImageEditor() );

			// Zoom in and pan.
			act( () => {
				result.current.setZoom( 3 );
			} );

			act( () => {
				result.current.setPan( { x: 0.2, y: 0.2 } );
			} );

			expect( result.current.isDirty ).toBe( true );

			// Reset each field back to its initial value manually.
			act( () => {
				result.current.setZoom( 1 );
			} );

			act( () => {
				result.current.setPan( { x: 0, y: 0 } );
			} );

			expect( result.current.isDirty ).toBe( false );
		} );

		// Regression: loading an image runs the new state through
		// enforceContainment, which can nudge pan/zoom by float ulp on
		// non-square images. The initial snapshot must be refreshed so
		// isDirty still reports false at a "clean" post-load state.
		it( 'should be false after setImage on a non-square image', () => {
			const { result } = renderHook( () => useInternalImageEditor() );

			act( () => {
				result.current.setImage( {
					src: 'test.jpg',
					naturalWidth: 1600,
					naturalHeight: 900,
				} );
			} );

			expect( result.current.isDirty ).toBe( false );
		} );

		it( 'does not reset the clean baseline when the same image is reported again', () => {
			const image = {
				src: 'test.jpg',
				naturalWidth: 1600,
				naturalHeight: 900,
			};
			const { result } = renderHook( () => useInternalImageEditor() );

			act( () => {
				result.current.setImage( image );
			} );
			act( () => {
				result.current.setRotation( 45 );
			} );
			expect( result.current.isDirty ).toBe( true );

			act( () => {
				result.current.setImage( image );
			} );

			expect( result.current.isDirty ).toBe( true );
			expect( result.current.state.rotation ).toBe( 45 );
		} );

		// Regression: reset() on a loaded image must produce a "clean"
		// snapshot that matches what the reducer actually stored
		// (preserving the image, re-enforcing containment). Otherwise
		// isDirty reports true right after reset.
		it( 'should be false after reset on a loaded image', () => {
			const { result } = renderHook( () => useInternalImageEditor() );

			act( () => {
				result.current.setImage( {
					src: 'test.jpg',
					naturalWidth: 1600,
					naturalHeight: 900,
				} );
			} );

			act( () => {
				result.current.setZoom( 2 );
				result.current.setRotation( 45 );
			} );

			expect( result.current.isDirty ).toBe( true );

			act( () => {
				result.current.reset();
			} );

			expect( result.current.isDirty ).toBe( false );
		} );
	} );

	describe( 'containment enforcement', () => {
		// For these tests, we need a loaded image so the reducer can
		// compute minZoomForCover and restrict position.
		function setupWithImage() {
			const view = renderHook( () => useInternalImageEditor() );
			act( () => {
				view.result.current.setImage( {
					src: 'test.jpg',
					naturalWidth: 1000,
					naturalHeight: 500,
				} );
			} );
			return view;
		}

		it( 'should restrict position when SET_CROP is dispatched', () => {
			const { result } = setupWithImage();

			// At zoom=1, no panning is possible — the image exactly covers
			// the crop area. Any pan value should be clamped to (0, 0).
			act( () => {
				result.current.setPan( { x: 0.5, y: 0.5 } );
			} );

			expect( result.current.state.pan.x ).toBeCloseTo( 0, 5 );
			expect( result.current.state.pan.y ).toBeCloseTo( 0, 5 );
		} );

		it( 'should allow limited panning at zoom > 1', () => {
			const { result } = setupWithImage();

			act( () => {
				result.current.setZoom( 2 );
			} );

			act( () => {
				result.current.setPan( { x: 0.3, y: 0.3 } );
			} );

			// Should be within bounds (not clamped to 0)
			expect( result.current.state.pan.x ).toBeGreaterThan( 0 );
			expect( result.current.state.pan.y ).toBeGreaterThan( 0 );

			// But if we try an extreme pan, it should be clamped
			act( () => {
				result.current.setPan( { x: 100, y: 100 } );
			} );

			expect( result.current.state.pan.x ).toBeLessThan( 1 );
			expect( result.current.state.pan.y ).toBeLessThan( 1 );
		} );

		it( 'should bump zoom to cover crop during rotation', () => {
			const { result } = setupWithImage();

			expect( result.current.state.zoom ).toBe( 1 );

			// Rotate 45 degrees via simple SET_ROTATION (no container).
			// The crop rect is unchanged and zoom is bumped to cover.
			act( () => {
				result.current.setRotation( 45 );
			} );

			expect( result.current.state.rotation ).toBe( 45 );
			expect( result.current.state.zoom ).toBeGreaterThanOrEqual( 1 );
		} );

		it( 'should preserve zoom across rotation changes', () => {
			const { result } = setupWithImage();

			act( () => {
				result.current.setZoom( 2 );
			} );

			act( () => {
				result.current.setRotation( 45 );
			} );

			// Zoom should be at least 2 (may be higher for 45° coverage).
			expect( result.current.state.zoom ).toBeGreaterThanOrEqual( 2 );

			act( () => {
				result.current.setRotation( 0 );
			} );

			// Zoom should not drop below the user's explicit level.
			// It only ratchets up; the user can zoom out explicitly if
			// they want.
			expect( result.current.state.zoom ).toBeGreaterThanOrEqual( 2 );
		} );

		it( 'should reset pan when rotation changes', () => {
			const { result } = setupWithImage();

			// Zoom in and pan
			act( () => {
				result.current.setZoom( 3 );
			} );
			act( () => {
				result.current.setPan( { x: 0.2, y: 0.2 } );
			} );

			expect( result.current.state.pan.x ).toBeCloseTo( 0.2 );

			// Rotate — position should be re-restricted
			act( () => {
				result.current.setRotation( 45 );
			} );

			// The position should be within the new valid range
			const { pan, zoom } = result.current.state;
			// Verify the position is valid for the new state
			expect( Math.abs( pan.x ) ).toBeLessThanOrEqual( zoom );
			expect( Math.abs( pan.y ) ).toBeLessThanOrEqual( zoom );
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
				result.current.setPan( { x: 1, y: 1 } );
			} );

			const panAtZoom4 = { ...result.current.state.pan };

			// Zoom out — pan should be reduced to stay within bounds
			act( () => {
				result.current.setZoom( 2 );
			} );

			expect(
				Math.abs( result.current.state.pan.x )
			).toBeLessThanOrEqual( Math.abs( panAtZoom4.x ) );
		} );

		it( 'should rescale crop and bump zoom at 90-degree rotation for non-square image', () => {
			const { result } = setupWithImage();
			// Image is 1000x500 (2:1). At 90° the visual box flips from
			// landscape to portrait. The crop rect is rescaled to preserve
			// pixel size, and zoom is bumped to cover it.
			act( () => {
				result.current.setRotation( 90 );
			} );

			const { cropRect, zoom } = result.current.state;
			// Crop pixel dimensions preserved — the normalized values
			// change because the visual box dimensions swapped.
			expect( cropRect.width ).toBeGreaterThan( 0 );
			expect( cropRect.height ).toBeGreaterThan( 0 );
			// Zoom bumps to cover the rescaled crop.
			expect( zoom ).toBeGreaterThanOrEqual( 1 );
		} );

		it( 'should not reduce zoom when SET_CROP_RECT shrinks the crop', () => {
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

			// Now shrink the crop rect — zoom should not decrease.
			act( () => {
				result.current.setCropRect( {
					x: 0.1,
					y: 0.1,
					width: 0.3,
					height: 0.3,
				} );
			} );

			expect( result.current.state.zoom ).toBeGreaterThanOrEqual(
				zoomAfterRotation
			);
		} );

		it( 'should bump zoom when SET_CROP_RECT requires it at rotation', () => {
			const { result } = setupWithImage();

			act( () => {
				result.current.setRotation( 45 );
			} );

			// Zoom was already bumped by rotation to cover full crop.
			const zoomAfterRotation = result.current.state.zoom;
			expect( zoomAfterRotation ).toBeGreaterThan( 1 );

			// Setting a smaller crop rect then a full one should keep zoom
			// at the level needed for the full rect.
			act( () => {
				result.current.setCropRect( {
					x: 0.2,
					y: 0.2,
					width: 0.6,
					height: 0.6,
				} );
			} );

			act( () => {
				result.current.setCropRect( {
					x: 0,
					y: 0,
					width: 1,
					height: 1,
				} );
			} );

			// Zoom should be at least what rotation required.
			expect( result.current.state.zoom ).toBeGreaterThanOrEqual(
				zoomAfterRotation
			);
			expect( result.current.state.cropRect.width ).toBeCloseTo( 1, 1 );
			expect( result.current.state.cropRect.height ).toBeCloseTo( 1, 1 );
		} );
	} );

	describe( 'SETTLE_CROP', () => {
		function setupWithImage() {
			const view = renderHook( () => useInternalImageEditor() );
			act( () => {
				view.result.current.setImage( {
					src: 'test.jpg',
					naturalWidth: 1000,
					naturalHeight: 500,
				} );
			} );
			return view;
		}

		it( 'expands a small crop to fill height and centers it', () => {
			const { result } = setupWithImage();

			// Shrink the crop rect to a small centered area.
			act( () => {
				result.current.setCropRect( {
					x: 0.25,
					y: 0.25,
					width: 0.5,
					height: 0.5,
				} );
			} );

			act( () => {
				result.current.settleCrop();
			} );

			const { cropRect } = result.current.state;
			// Should expand to fill height (height=1) or width (width=1).
			expect(
				Math.abs( cropRect.height - 1 ) < 0.01 ||
					Math.abs( cropRect.width - 1 ) < 0.01
			).toBe( true );
			// Should be centered.
			const cx = cropRect.x + cropRect.width / 2;
			const cy = cropRect.y + cropRect.height / 2;
			expect( cx ).toBeCloseTo( 0.5, 1 );
			expect( cy ).toBeCloseTo( 0.5, 1 );
		} );

		it( 'preserves the image selection (visible content center does not jump)', () => {
			const { result } = setupWithImage();

			// Zoom in so there is room to pan.
			act( () => {
				result.current.setZoom( 3 );
			} );

			// Resize crop to a smaller centered area (center at 0.5, 0.5).
			act( () => {
				result.current.setCropRect( {
					x: 0.25,
					y: 0.25,
					width: 0.5,
					height: 0.5,
				} );
			} );

			// Record pre-settle state.
			const preCropRect = result.current.state.cropRect;
			const preZoom = result.current.state.zoom;

			act( () => {
				result.current.settleCrop();
			} );

			const postCropRect = result.current.state.cropRect;
			const postZoom = result.current.state.zoom;

			// The zoom should scale by the expansion factor.
			const s = postCropRect.height / preCropRect.height;
			expect( postZoom ).toBeCloseTo( preZoom * s, 1 );

			// The crop center should remain at (0.5, 0.5).
			const postCx = postCropRect.x + postCropRect.width / 2;
			const postCy = postCropRect.y + postCropRect.height / 2;
			expect( postCx ).toBeCloseTo( 0.5, 1 );
			expect( postCy ).toBeCloseTo( 0.5, 1 );
		} );

		it( 'is a no-op when crop is already full and centered', () => {
			const { result } = setupWithImage();

			// State is already default: full crop, centered.
			const stateBefore = result.current.state;

			act( () => {
				result.current.settleCrop();
			} );

			const stateAfter = result.current.state;
			expect( stateAfter.cropRect ).toEqual( stateBefore.cropRect );
			expect( stateAfter.zoom ).toEqual( stateBefore.zoom );
			expect( stateAfter.pan.x ).toBeCloseTo( stateBefore.pan.x, 5 );
			expect( stateAfter.pan.y ).toBeCloseTo( stateBefore.pan.y, 5 );
		} );
	} );

	describe( 'SNAP_ROTATE_90', () => {
		function setupWithImage() {
			const view = renderHook( () => useInternalImageEditor() );
			act( () => {
				view.result.current.setImage( {
					src: 'test.jpg',
					naturalWidth: 1000,
					naturalHeight: 500,
				} );
			} );
			return view;
		}

		it( 'after snap rotate CW, crop width and height are swapped', () => {
			const { result } = setupWithImage();

			// Set a non-square crop so the swap is visible.
			act( () => {
				result.current.setCropRect( {
					x: 0.1,
					y: 0.2,
					width: 0.6,
					height: 0.4,
				} );
			} );

			const widthBefore = result.current.state.cropRect.width;
			const heightBefore = result.current.state.cropRect.height;

			act( () => {
				result.current.snapRotate90( 1 );
			} );

			// After snap rotate, width and height should be swapped
			// (though enforceContainment may adjust slightly).
			const { cropRect } = result.current.state;
			expect( cropRect.width ).toBeCloseTo( heightBefore, 1 );
			expect( cropRect.height ).toBeCloseTo( widthBefore, 1 );
			expect( result.current.state.rotation ).toBe( 90 );
		} );

		it( 'after snap rotate CCW, crop width and height are swapped', () => {
			const { result } = setupWithImage();

			act( () => {
				result.current.setCropRect( {
					x: 0.1,
					y: 0.2,
					width: 0.6,
					height: 0.4,
				} );
			} );

			const widthBefore = result.current.state.cropRect.width;
			const heightBefore = result.current.state.cropRect.height;

			act( () => {
				result.current.snapRotate90( -1 );
			} );

			const { cropRect } = result.current.state;
			expect( cropRect.width ).toBeCloseTo( heightBefore, 1 );
			expect( cropRect.height ).toBeCloseTo( widthBefore, 1 );
			expect( result.current.state.rotation ).toBe( 270 );
		} );

		it( 'after two snap rotates CW (180 degrees), dimensions return to original', () => {
			const { result } = setupWithImage();

			act( () => {
				result.current.setCropRect( {
					x: 0.1,
					y: 0.2,
					width: 0.6,
					height: 0.4,
				} );
			} );

			const widthBefore = result.current.state.cropRect.width;
			const heightBefore = result.current.state.cropRect.height;

			act( () => {
				result.current.snapRotate90( 1 );
			} );

			act( () => {
				result.current.snapRotate90( 1 );
			} );

			const { cropRect } = result.current.state;
			expect( cropRect.width ).toBeCloseTo( widthBefore, 1 );
			expect( cropRect.height ).toBeCloseTo( heightBefore, 1 );
			expect( result.current.state.rotation ).toBe( 180 );
		} );
	} );

	describe( 'public controller contract', () => {
		it( 'does not expose the raw reducer dispatch', () => {
			const { result } = renderHook( () => useInternalImageEditor() );

			expect( '__dispatch' in result.current ).toBe( false );
		} );
	} );

	describe( 'isStateDirty coverage guard', () => {
		// This test ensures that isStateDirty checks ALL fields in InternalImageEditorState.
		// If you add a field to InternalImageEditorState/DEFAULT_STATE and this test fails,
		// you MUST also update isStateDirty() in use-image-editor.ts.
		it( 'should track all InternalImageEditorState fields', () => {
			// Flatten DEFAULT_STATE keys into dot-notation paths.
			// e.g., { pan: { x: 0, y: 0 } } → ['crop.x', 'crop.y']
			function flattenKeys(
				obj: Record< string, unknown >,
				prefix = ''
			): string[] {
				const keys: string[] = [];
				for ( const key of Object.keys( obj ) ) {
					const fullKey = prefix ? `${ prefix }.${ key }` : key;
					const value = obj[ key ];
					if (
						value !== null &&
						typeof value === 'object' &&
						! Array.isArray( value )
					) {
						keys.push(
							...flattenKeys(
								value as Record< string, unknown >,
								fullKey
							)
						);
					} else {
						keys.push( fullKey );
					}
				}
				return keys.sort();
			}

			// The fields that isStateDirty currently checks.
			// Keep this in sync — if you add a field to InternalImageEditorState,
			// add it here AND in isStateDirty().
			const dirtyCheckedFields = [
				'pan.x',
				'pan.y',
				'cropRect.height',
				'cropRect.width',
				'cropRect.x',
				'cropRect.y',
				'flip.horizontal',
				'flip.vertical',
				'rotation',
				'zoom',
			].sort();

			// 'image' is intentionally excluded — it's set once on load
			// and doesn't represent a user edit.
			// 'image' is set once on load.
			// Base fields can affect a later rotation, but do not change
			// the current image output, so they are not dirty fields.
			const excludedFields = [
				'image',
				'basePan',
				'baseZoom',
				'baseRotation',
			];

			const stateKeys = flattenKeys(
				DEFAULT_STATE as unknown as Record< string, unknown >
			).filter(
				( key ) =>
					! excludedFields.some(
						( ex ) => key === ex || key.startsWith( ex + '.' )
					)
			);

			expect( stateKeys ).toEqual( dirtyCheckedFields );
		} );
	} );

	it( 'locks the aspect ratio and reshapes the crop for the loaded image', () => {
		const { result } = renderHook( () => useInternalImageEditor() );

		act( () =>
			result.current.setImage( {
				src: 'photo.jpg',
				naturalWidth: 800,
				naturalHeight: 450,
			} )
		);
		act( () => result.current.setAspectRatio( 1 ) );

		expect( result.current.state.aspectRatio ).toBe( 1 );
		expect( result.current.state.cropRect ).toEqual(
			computeInscribedRect( 1, { width: 800, height: 450 } )
		);
	} );
} );

describe( 'useInternalImageEditor with the state kept by the caller', () => {
	const IMAGE = { src: 'photo.jpg', naturalWidth: 1200, naturalHeight: 600 };

	function useControlled(
		initialState: InternalImageEditorState = createImageEditorState( {
			image: IMAGE,
		} ) as InternalImageEditorState
	) {
		const [ state, setState ] = useState( initialState );
		const changes = useRef< Array< { isEdit: boolean } > >( [] );
		const controller = useInternalImageEditor( {
			state,
			onChange: ( next: InternalImageEditorState, details ) => {
				changes.current.push( details );
				setState( next );
			},
		} );
		return { controller, changes: changes.current };
	}

	it( 'reports each change as an edit and shows the state it is given', () => {
		const { result } = renderHook( () => useControlled() );

		act( () => result.current.controller.snapRotate90( 1 ) );

		expect( result.current.controller.state.rotation ).toBe( 90 );
		expect( result.current.changes ).toContainEqual( { isEdit: true } );
		expect( result.current.controller.isDirty ).toBe( true );
	} );

	it( 'reports a viewport refit and a new image as not edits', () => {
		const { result } = renderHook( () => useControlled() );

		act( () =>
			result.current.controller.adjustCropRectForViewport( {
				x: 0.1,
				y: 0.1,
				width: 0.5,
				height: 0.5,
			} )
		);
		act( () =>
			result.current.controller.setImage( {
				src: 'other.jpg',
				naturalWidth: 800,
				naturalHeight: 800,
			} )
		);

		expect( result.current.changes ).toEqual( [
			{ isEdit: false },
			{ isEdit: false },
		] );
	} );

	it( 'keeps the latest state across several changes in one event', () => {
		const { result } = renderHook( () => useControlled() );

		act( () => {
			result.current.controller.toggleFlip( 'horizontal' );
			result.current.controller.toggleFlip( 'horizontal' );
		} );

		expect( result.current.controller.state.flip.horizontal ).toBe( false );
	} );

	it( "takes a state built by hand, without the editor's own values", () => {
		// Only the fields the public `ImageEditorState` declares.
		const byHand = {
			image: IMAGE,
			pan: { x: 0, y: 0 },
			zoom: 1,
			rotation: 0,
			flip: { horizontal: false, vertical: false },
			cropRect: { x: 0, y: 0, width: 1, height: 1 },
		} as InternalImageEditorState;
		const { result } = renderHook( () => useControlled( byHand ) );

		// Reaches the reducer, which reads the editor's own values, rather
		// than throwing on the way in.
		act( () => result.current.controller.setZoom( 2 ) );

		expect( result.current.controller.state.zoom ).toBe( 2 );
		expect( result.current.controller.isDirty ).toBe( true );
	} );

	it( 'starts fresh after the image is cleared and another loads', () => {
		const { result } = renderHook( () => useControlled() );

		act( () => result.current.controller.setZoom( 2 ) );
		act( () => result.current.controller.setImage( null ) );
		act( () =>
			result.current.controller.setImage( {
				src: 'other.jpg',
				naturalWidth: 800,
				naturalHeight: 800,
			} )
		);

		expect( result.current.controller.state.zoom ).toBe( 1 );
		expect( result.current.controller.isDirty ).toBe( false );
	} );

	describe( 'with a locked ratio to start', () => {
		const LOCKED = {
			...createImageEditorState(),
			aspectRatio: 1,
		} as InternalImageEditorState;
		// The square crop for the 2:1 image.
		const FITTED = computeInscribedRect( 1, { width: 1200, height: 600 } );
		const MISMATCHED = {
			...createImageEditorState( { image: IMAGE } ),
			aspectRatio: 1,
		} as InternalImageEditorState;

		it( 'fits a supplied locked crop without a canvas or an undo entry', () => {
			const { result } = renderHook( () => useControlled( MISMATCHED ) );

			expect( result.current.controller.state.cropRect ).toEqual(
				FITTED
			);
			expect( result.current.controller.isDirty ).toBe( false );
			expect( result.current.changes ).toEqual( [ { isEdit: false } ] );
		} );

		it( 'keeps a supplied locked crop fitted through the first edit', () => {
			const { result } = renderHook( () => useControlled( MISMATCHED ) );

			act( () => result.current.controller.setZoom( 2 ) );

			expect( result.current.controller.state.cropRect ).toEqual(
				FITTED
			);
			expect( result.current.controller.isDirty ).toBe( true );
		} );

		it( 'fits the crop to the lock when the image loads, and is clean', () => {
			const { result } = renderHook( () => useControlled( LOCKED ) );

			act( () => result.current.controller.setImage( IMAGE ) );

			expect( result.current.controller.state.cropRect ).toEqual(
				FITTED
			);
			expect( result.current.controller.isDirty ).toBe( false );
		} );

		it( 'returns to the fitted square, still locked, on reset', () => {
			const { result } = renderHook( () => useControlled( LOCKED ) );
			act( () => result.current.controller.setImage( IMAGE ) );

			act( () => result.current.controller.snapRotate90( 1 ) );
			expect( result.current.controller.isDirty ).toBe( true );

			act( () => result.current.controller.reset() );

			expect( result.current.controller.state.aspectRatio ).toBe( 1 );
			expect( result.current.controller.state.rotation ).toBe( 0 );
			expect( result.current.controller.state.cropRect ).toEqual(
				FITTED
			);
			expect( result.current.controller.isDirty ).toBe( false );
		} );

		it( 'fits the crop when the state starts with its image and a lock', () => {
			const { result } = renderHook( () =>
				useControlled(
					createImageEditorState( {
						image: IMAGE,
						aspectRatio: 1,
					} ) as InternalImageEditorState
				)
			);

			// The canvas reports the image it loaded, which the state has.
			act( () => result.current.controller.setImage( IMAGE ) );

			expect( result.current.controller.state.cropRect ).toEqual(
				FITTED
			);
			expect( result.current.controller.isDirty ).toBe( false );
		} );

		it( 'starts a different image fresh, keeping the lock', () => {
			const { result } = renderHook( () => useControlled( LOCKED ) );
			act( () => result.current.controller.setImage( IMAGE ) );
			act( () => {
				result.current.controller.snapRotate90( 1 );
				result.current.controller.toggleFlip( 'horizontal' );
			} );

			act( () =>
				result.current.controller.setImage( {
					src: 'other.jpg',
					naturalWidth: 800,
					naturalHeight: 800,
				} )
			);

			const { state } = result.current.controller;
			expect( state.image?.src ).toBe( 'other.jpg' );
			expect( state.aspectRatio ).toBe( 1 );
			expect( state.rotation ).toBe( 0 );
			expect( state.flip ).toEqual( {
				horizontal: false,
				vertical: false,
			} );
			expect( result.current.controller.isDirty ).toBe( false );
		} );
	} );
} );
