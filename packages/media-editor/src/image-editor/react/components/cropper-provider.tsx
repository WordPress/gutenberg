/**
 * WordPress dependencies
 */
import {
	createContext,
	useContext,
	useMemo,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	useCropperState,
	type UseCropperStateReturn,
} from '../hooks/use-cropper-state';
import type { CropperState } from '../../core/types';
import type { CropperLayoutGeometry } from '../../core/crop-geometry';

/**
 * The context value type for the CropperProvider.
 * Contains the full return value of useCropperState.
 */
type CropperContextValue = UseCropperStateReturn | null;

const CropperContext = createContext< CropperContextValue >( null );

type CropperLayoutGeometryContextValue = {
	geometry: CropperLayoutGeometry | null;
	setGeometry: React.Dispatch<
		React.SetStateAction< CropperLayoutGeometry | null >
	>;
} | null;

const CropperLayoutGeometryContext =
	createContext< CropperLayoutGeometryContextValue >( null );

const noopSetGeometry: React.Dispatch<
	React.SetStateAction< CropperLayoutGeometry | null >
> = () => {};

/**
 * Props for the CropperProvider component.
 */
interface CropperProviderProps {
	/** Optional partial initial state to merge with defaults. */
	initialState?: Partial< CropperState >;
	/** Child components. */
	children: React.ReactNode;
}

/**
 * Convenience context provider that wraps useCropperState.
 *
 * Provides the full cropper state and action creators to all
 * descendant components via React context.
 *
 * @param props              Provider props.
 * @param props.initialState
 * @param props.children
 * @return The provider element wrapping children.
 */
export function CropperProvider( {
	initialState,
	children,
}: CropperProviderProps ) {
	const cropperReturn = useCropperState( initialState );
	const [ geometry, setGeometry ] = useState< CropperLayoutGeometry | null >(
		null
	);
	const geometryContextValue = useMemo(
		() => ( { geometry, setGeometry } ),
		[ geometry ]
	);

	return (
		<CropperContext.Provider value={ cropperReturn }>
			<CropperLayoutGeometryContext.Provider
				value={ geometryContextValue }
			>
				{ children }
			</CropperLayoutGeometryContext.Provider>
		</CropperContext.Provider>
	);
}

/**
 * Hook to consume the CropperProvider context.
 *
 * Must be used within a CropperProvider. Throws if used outside
 * of the provider tree.
 *
 * @return The cropper state and action creators.
 */
export function useCropper(): UseCropperStateReturn {
	const context = useContext( CropperContext );

	if ( ! context ) {
		throw new Error( 'useCropper must be used within a CropperProvider.' );
	}

	return context;
}

/**
 * Hook to consume the measured cropper layout geometry.
 *
 * @return Measured cropper layout geometry, or null before the Cropper publishes it.
 */
export function useCropperLayoutGeometry(): CropperLayoutGeometry | null {
	const context = useContext( CropperLayoutGeometryContext );

	if ( ! context ) {
		throw new Error(
			'useCropperLayoutGeometry must be used within a CropperProvider.'
		);
	}

	return context.geometry;
}

/**
 * Hook to publish measured cropper layout geometry.
 *
 * @return Setter for measured cropper layout geometry.
 */
export function useSetCropperLayoutGeometry(): React.Dispatch<
	React.SetStateAction< CropperLayoutGeometry | null >
> {
	const context = useContext( CropperLayoutGeometryContext );

	if ( ! context ) {
		throw new Error(
			'useSetCropperLayoutGeometry must be used within a CropperProvider.'
		);
	}

	return context.setGeometry;
}

/**
 * Hook to optionally publish measured geometry when a CropperProvider exists.
 * Standalone Cropper usage remains supported and simply skips publication.
 *
 * @return Geometry setter, or a no-op outside CropperProvider.
 */
export function useOptionalSetCropperLayoutGeometry(): React.Dispatch<
	React.SetStateAction< CropperLayoutGeometry | null >
> {
	const context = useContext( CropperLayoutGeometryContext );

	return context?.setGeometry ?? noopSetGeometry;
}
