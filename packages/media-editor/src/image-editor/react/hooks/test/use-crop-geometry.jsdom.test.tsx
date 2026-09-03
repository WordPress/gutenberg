import { renderHook, waitFor } from '@testing-library/react';
import { useEffect } from '@wordpress/element';
import { DEFAULT_STATE } from '../../../core/constants';
import type { CropperState, Size } from '../../../core/types';
import {
	CropperProvider,
	useOptionalSetCropperCanvasSize,
} from '../../components/cropper-provider';
import { useCropGeometry } from '../use-crop-geometry';

const IMAGE = {
	src: 'test.jpg',
	naturalWidth: 1000,
	naturalHeight: 500,
};

const CANVAS_SIZE: Size = { width: 1000, height: 500 };

const INITIAL_STATE: Partial< CropperState > = {
	image: IMAGE,
	cropRect: { x: 0.2, y: 0.2, width: 0.4, height: 0.4 },
};

function CanvasSizePublisher( { size }: { size: Size } ) {
	const setCanvasSize = useOptionalSetCropperCanvasSize();

	useEffect( () => {
		setCanvasSize( size );
		return () => {
			setCanvasSize( { width: 0, height: 0 } );
		};
	}, [ size, setCanvasSize ] );

	return null;
}

function createWrapper( {
	initialState = INITIAL_STATE,
	canvasSize,
}: {
	initialState?: Partial< CropperState >;
	canvasSize?: Size;
} = {} ) {
	return function Wrapper( { children }: { children: React.ReactNode } ) {
		return (
			<CropperProvider initialState={ initialState }>
				{ canvasSize && <CanvasSizePublisher size={ canvasSize } /> }
				{ children }
			</CropperProvider>
		);
	};
}

describe( 'useCropGeometry', () => {
	it( 'returns not ready before an image is loaded', async () => {
		const { result } = renderHook( () => useCropGeometry(), {
			wrapper: createWrapper( {
				initialState: { ...DEFAULT_STATE, image: null },
				canvasSize: CANVAS_SIZE,
			} ),
		} );

		await waitFor( () => {
			expect( result.current.isReady ).toBe( false );
		} );
		expect( result.current.rect ).toBeNull();
		expect( result.current.imageBounds ).toBeNull();
		expect( result.current.sourceRegion ).toBeNull();
	} );

	it( 'returns not ready before the canvas has been measured', () => {
		const { result } = renderHook( () => useCropGeometry(), {
			wrapper: createWrapper(),
		} );

		expect( result.current.isReady ).toBe( false );
		expect( result.current.rect ).toBeNull();
		expect( result.current.imageBounds ).toBeNull();
	} );

	it( 'returns the current crop pixels, image bounds, and source region after canvas size is published', async () => {
		const { result } = renderHook( () => useCropGeometry(), {
			wrapper: createWrapper( { canvasSize: CANVAS_SIZE } ),
		} );

		await waitFor( () => {
			expect( result.current.isReady ).toBe( true );
		} );

		expect( result.current.rect?.left ).toBeCloseTo( 200 );
		expect( result.current.rect?.top ).toBeCloseTo( 100 );
		expect( result.current.rect?.width ).toBeCloseTo( 400 );
		expect( result.current.imageBounds?.maxRight ).toBeCloseTo( 1000 );
		expect( result.current.imageBounds?.minWidth ).toBeCloseTo( 50 );
		expect( result.current.sourceRegion?.width ).toBeCloseTo( 400 );
	} );
} );
