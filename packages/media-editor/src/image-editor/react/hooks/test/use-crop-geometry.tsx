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
import type { NormalizedCropBounds } from '../../../core/crop-geometry';
import {
	CropperProvider,
	useCropperImageBoundsContext,
} from '../../components/cropper-provider';
import { useCropGeometry } from '../use-crop-geometry';

const IMAGE = {
	src: 'test.jpg',
	naturalWidth: 1000,
	naturalHeight: 500,
};

const IMAGE_BOUNDS: NormalizedCropBounds = {
	minX: 0,
	minY: 0,
	maxX: 1,
	maxY: 1,
};

const INITIAL_STATE: Partial< CropperState > = {
	image: IMAGE,
	cropRect: { x: 0.2, y: 0.2, width: 0.4, height: 0.4 },
};

function ImageBoundsPublisher( {
	imageBounds,
}: {
	imageBounds: NormalizedCropBounds;
} ) {
	const { setImageBounds } = useCropperImageBoundsContext();

	useEffect( () => {
		setImageBounds( imageBounds );
		return () => {
			setImageBounds( undefined );
		};
	}, [ imageBounds, setImageBounds ] );

	return null;
}

function createWrapper( {
	initialState = INITIAL_STATE,
	imageBounds,
}: {
	initialState?: Partial< CropperState >;
	imageBounds?: NormalizedCropBounds;
} = {} ) {
	return function Wrapper( { children }: { children: React.ReactNode } ) {
		return (
			<CropperProvider initialState={ initialState }>
				{ imageBounds && (
					<ImageBoundsPublisher imageBounds={ imageBounds } />
				) }
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
				imageBounds: IMAGE_BOUNDS,
			} ),
		} );

		await waitFor( () => {
			expect( result.current.isReady ).toBe( false );
		} );
		expect( result.current.rect ).toBeNull();
		expect( result.current.imageBounds ).toBeNull();
		expect( result.current.sourceRegion ).toBeNull();
	} );

	it( 'returns not ready before cropper image bounds are published', () => {
		const { result } = renderHook( () => useCropGeometry(), {
			wrapper: createWrapper(),
		} );

		expect( result.current.isReady ).toBe( false );
		expect( result.current.rect ).toBeNull();
		expect( result.current.imageBounds ).toBeNull();
	} );

	it( 'returns the current crop pixels, image bounds, and source region after geometry is published', async () => {
		const { result } = renderHook( () => useCropGeometry(), {
			wrapper: createWrapper( { imageBounds: IMAGE_BOUNDS } ),
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
