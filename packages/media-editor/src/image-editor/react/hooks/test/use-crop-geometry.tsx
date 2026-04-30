/**
 * External dependencies
 */
import { act, renderHook, waitFor } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { DEFAULT_STATE } from '../../../core/constants';
import type { CropperState } from '../../../core/types';
import type { CropperLayoutGeometry } from '../../../core/crop-geometry';
import {
	CropperProvider,
	useSetCropperGeometry,
} from '../../components/cropper-provider';
import { useCropGeometry } from '../use-crop-geometry';

const IMAGE = {
	src: 'test.jpg',
	naturalWidth: 1000,
	naturalHeight: 500,
};

const GEOMETRY: CropperLayoutGeometry = {
	canvasSize: { width: 1000, height: 500 },
	elementSize: { width: 1000, height: 500 },
	visualSize: { width: 1000, height: 500 },
	cropBounds: { minX: 0, minY: 0, maxX: 1, maxY: 1 },
};

const INITIAL_STATE: Partial< CropperState > = {
	image: IMAGE,
	cropRect: { x: 0.2, y: 0.2, width: 0.4, height: 0.4 },
};

function GeometryPublisher( {
	geometry,
}: {
	geometry: CropperLayoutGeometry;
} ) {
	const setGeometry = useSetCropperGeometry();

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
	geometry?: CropperLayoutGeometry;
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
		const { result } = renderHook(
			() => useCropGeometry( { freeformCrop: true } ),
			{
				wrapper: createWrapper( {
					initialState: { ...DEFAULT_STATE, image: null },
					geometry: GEOMETRY,
				} ),
			}
		);

		await waitFor( () => {
			expect( result.current.isReady ).toBe( false );
		} );
		expect( result.current.rect ).toBeNull();
		expect( result.current.sourceRegion ).toBeNull();
	} );

	it( 'returns not ready before cropper geometry is published', () => {
		const { result } = renderHook(
			() => useCropGeometry( { freeformCrop: true } ),
			{ wrapper: createWrapper() }
		);

		expect( result.current.isReady ).toBe( false );
		expect( result.current.rect ).toBeNull();
	} );

	it( 'returns the current crop pixels and operation ranges after geometry is published', async () => {
		const { result } = renderHook(
			() => useCropGeometry( { freeformCrop: true } ),
			{ wrapper: createWrapper( { geometry: GEOMETRY } ) }
		);

		await waitFor( () => {
			expect( result.current.isReady ).toBe( true );
		} );

		expect( result.current.rect?.left ).toBeCloseTo( 200 );
		expect( result.current.rect?.top ).toBeCloseTo( 100 );
		expect( result.current.rect?.width ).toBeCloseTo( 400 );
		expect( result.current.sourceRegion?.width ).toBeCloseTo( 400 );

		const range = result.current.getRange( { type: 'move-x' } );
		expect( range.minValue ).toBeCloseTo( 0 );
		expect( range.maxValue ).toBeCloseTo( 600 );
		expect( range.canApply ).toBe( true );
	} );

	it( 'disables resize operations when freeform crop is off', async () => {
		const { result } = renderHook(
			() => useCropGeometry( { freeformCrop: false } ),
			{ wrapper: createWrapper( { geometry: GEOMETRY } ) }
		);

		await waitFor( () => {
			expect( result.current.isReady ).toBe( true );
		} );

		expect( result.current.capabilities.canResizeWidth ).toBe( false );
		expect(
			result.current.getRange( { type: 'resize-width' } ).canApply
		).toBe( false );
	} );

	it( 'clamps out-of-range operations when applying them', async () => {
		const { result } = renderHook(
			() => useCropGeometry( { freeformCrop: true } ),
			{ wrapper: createWrapper( { geometry: GEOMETRY } ) }
		);

		await waitFor( () => {
			expect( result.current.isReady ).toBe( true );
		} );

		act( () => {
			result.current.applyGeometryOperation( {
				type: 'move-x',
				value: -999,
			} );
		} );

		await waitFor( () => {
			expect( result.current.rect?.left ).toBeCloseTo( 0 );
		} );
	} );
} );
