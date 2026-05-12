import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import {
	useCropperReducer,
	type CropperController,
} from '../hooks/use-cropper-reducer';
import {
	useDerivedCropperMeasurements,
	type CropperMeasurements,
} from '../hooks/use-derived-cropper-measurements';
import type { CropperState, Size } from '../../core/types';

export type { CropperMeasurements };

interface CropperContextValue {
	controller: CropperController;
	canvasSize: Size;
	setCanvasSize: ( size: Size ) => void;
	measurements: CropperMeasurements;
	previewCropRect: CropperState[ 'cropRect' ] | null;
	setPreviewCropRect: ( rect: CropperState[ 'cropRect' ] | null ) => void;
}

const CropperContext = createContext< CropperContextValue | null >( null );

const ZERO_SIZE: Size = { width: 0, height: 0 };

interface CropperProviderProps {
	/** Optional partial initial state to merge with defaults. */
	initialState?: Partial< CropperState >;
	/** Optional controller supplied by a composite store. */
	controller?: CropperController;
	/** Child components. */
	children: React.ReactNode;
}

/**
 * Context provider for shared cropper state, measurements, and previews.
 *
 * By default this creates a pure `useCropperReducer` controller. Composite
 * stores such as the media editor can pass their own controller so sidebar
 * controls, geometry helpers, and the canvas all read the same state.
 *
 * @param props              Provider props.
 * @param props.initialState Optional partial initial state.
 * @param props.controller   Optional externally owned controller.
 * @param props.children     Provider children.
 */
export function CropperProvider( {
	initialState,
	controller: externalController,
	children,
}: CropperProviderProps ) {
	const ownedController = useCropperReducer( initialState );
	const controller = externalController ?? ownedController;
	const [ canvasSize, setCanvasSize ] = useState< Size >( ZERO_SIZE );
	const [ previewCropRect, setPreviewCropRect ] = useState<
		CropperState[ 'cropRect' ] | null
	>( null );
	const previousStateRef = useRef( controller.state );
	const measurements = useDerivedCropperMeasurements(
		controller.state,
		canvasSize
	);

	useEffect( () => {
		if ( previousStateRef.current === controller.state ) {
			return;
		}
		previousStateRef.current = controller.state;
		setPreviewCropRect( null );
	}, [ controller.state ] );

	const value = useMemo< CropperContextValue >(
		() => ( {
			controller,
			canvasSize,
			setCanvasSize,
			measurements,
			previewCropRect,
			setPreviewCropRect,
		} ),
		[ controller, canvasSize, measurements, previewCropRect ]
	);

	return (
		<CropperContext.Provider value={ value }>
			{ children }
		</CropperContext.Provider>
	);
}

function useCropperContext(): CropperContextValue {
	const context = useContext( CropperContext );
	if ( ! context ) {
		throw new Error(
			'Cropper hooks must be used within a CropperProvider.'
		);
	}
	return context;
}

/**
 * Hook to consume the cropper state controller.
 *
 * Must be used within a `CropperProvider`. Throws if used outside.
 *
 * @return The cropper state and action creators.
 */
export function useCropper(): CropperController {
	return useCropperContext().controller;
}

/**
 * Hook to consume the derived cropper measurements (`elementSize`,
 * `visualSize`, `cropBounds`).
 *
 * @return Measurements derived from the cropper state and measured canvas.
 */
export function useCropperMeasurements(): CropperMeasurements {
	return useCropperContext().measurements;
}

/**
 * Hook used by panel components inside a `CropperProvider` to publish a
 * non-committed crop rectangle preview. Throws without a Provider because
 * there is no preview channel to publish to.
 *
 * @return Setter for the draft crop rectangle; pass `null` to clear it.
 */
export function useSetCropperPreviewRect(): (
	rect: CropperState[ 'cropRect' ] | null
) => void {
	return useCropperContext().setPreviewCropRect;
}

/**
 * Hook used by `<Cropper>` to read the current draft crop rectangle. Also
 * works for standalone `<Cropper>` mounts that have no Provider above them;
 * those will always see `null`.
 *
 * @return Current draft crop rectangle, or null when no preview is active.
 */
export function useOptionalCropperPreviewRect():
	| CropperState[ 'cropRect' ]
	| null {
	return useContext( CropperContext )?.previewCropRect ?? null;
}

/**
 * Hook used by `<Cropper>` to publish its measured canvas size into the
 * Provider. When no Provider is mounted, returns a noop so the component
 * still renders in standalone usage.
 *
 * @return Setter for the canvas size, or a noop outside a CropperProvider.
 */
export function useOptionalSetCropperCanvasSize(): ( size: Size ) => void {
	const context = useContext( CropperContext );
	return context?.setCanvasSize ?? noopSetCanvasSize;
}

function noopSetCanvasSize() {}
