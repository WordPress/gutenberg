/**
 * External dependencies
 */
import { renderHook, waitFor } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { DEFAULT_STATE } from '../../../core/constants';
import type { CropperState } from '../../../core/types';
import type { MeasuredCropperGeometry } from '../../../core/crop-geometry';
import {
	CropperProvider,
	useSetMeasuredCropperGeometry,
} from '../../components/cropper-provider';
import { useCropGeometry } from '../use-crop-geometry';

const IMAGE = {
	src: 'test.jpg',
	naturalWidth: 1000,
	naturalHeight: 500,
};

const GEOMETRY: MeasuredCropperGeometry = {
	canvasSize: { width: 1000, height: 500 },
	elementSize: { width: 1000, height: 500 },
	visualSize: { width: 1000, height: 500 },
	imageBounds: { minX: 0, minY: 0, maxX: 1, maxY: 1 },
};

const INITIAL_STATE: Partial< CropperState > = {
	image: IMAGE,
	cropRect: { x: 0.2, y: 0.2, width: 0.4, height: 0.4 },
};

function GeometryPublisher( {
	geometry,
}: {
	geometry: MeasuredCropperGeometry;
} ) {
	const setGeometry = useSetMeasuredCropperGeometry();

	useEffect( () => {
		setGeometry( geometry );
		return () => {
			setGeometry( null );
		};
	}, [ geometry, setGeometry ] );

	return null;
}

function createWrapper( {
	initialState = INITIAL_STATE,
	geometry,
}: {
	initialState?: Partial< CropperState >;
	geometry?: MeasuredCropperGeometry;
} = {} ) {
	return function Wrapper( { children }: { children: React.ReactNode } ) {
		return (
			<CropperProvider initialState={ initialState }>
				{ geometry && <GeometryPublisher geometry={ geometry } /> }
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
				geometry: GEOMETRY,
			} ),
		} );

		await waitFor( () => {
			expect( result.current.isReady ).toBe( false );
		} );
		expect( result.current.rect ).toBeNull();
		expect( result.current.bounds ).toBeNull();
		expect( result.current.sourceRegion ).toBeNull();
		expect( result.current.snapshot ).toBeNull();
	} );

	it( 'returns not ready before cropper layout geometry is published', () => {
		const { result } = renderHook( () => useCropGeometry(), {
			wrapper: createWrapper(),
		} );

		expect( result.current.isReady ).toBe( false );
		expect( result.current.rect ).toBeNull();
		expect( result.current.bounds ).toBeNull();
	} );

	it( 'returns the current crop pixels, image bounds, and source region after geometry is published', async () => {
		const { result } = renderHook( () => useCropGeometry(), {
			wrapper: createWrapper( { geometry: GEOMETRY } ),
		} );

		await waitFor( () => {
			expect( result.current.isReady ).toBe( true );
		} );

		expect( result.current.rect?.left ).toBeCloseTo( 200 );
		expect( result.current.rect?.top ).toBeCloseTo( 100 );
		expect( result.current.rect?.width ).toBeCloseTo( 400 );
		expect( result.current.bounds?.image.maxRight ).toBeCloseTo( 1000 );
		expect( result.current.bounds?.image.minWidth ).toBeCloseTo( 50 );
		expect( result.current.bounds?.viewport ).toBeNull();
		expect( result.current.sourceRegion?.width ).toBeCloseTo( 400 );
		expect( result.current.snapshot?.rect.left ).toBeCloseTo( 200 );
	} );
} );
