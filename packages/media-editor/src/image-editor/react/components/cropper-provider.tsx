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
import type { NormalizedCropBounds } from '../../core/crop-geometry';

type CropperImageBounds = NormalizedCropBounds | undefined;

/**
 * The context value type for the CropperProvider.
 * Contains the full return value of useCropperState.
 */
type CropperContextValue = UseCropperStateReturn | null;

const CropperContext = createContext< CropperContextValue >( null );

interface CropperImageBoundsContextValue {
	imageBounds: CropperImageBounds;
	setImageBounds: React.Dispatch<
		React.SetStateAction< CropperImageBounds >
	>;
}

const CropperImageBoundsContext =
	createContext< CropperImageBoundsContextValue | null >( null );

const noopSetImageBounds: React.Dispatch<
	React.SetStateAction< CropperImageBounds >
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
	const [ imageBounds, setImageBounds ] = useState< CropperImageBounds >();
	const imageBoundsContextValue = useMemo(
		() => ( { imageBounds, setImageBounds } ),
		[ imageBounds ]
	);

	return (
		<CropperContext.Provider value={ cropperReturn }>
			<CropperImageBoundsContext.Provider
				value={ imageBoundsContextValue }
			>
				{ children }
			</CropperImageBoundsContext.Provider>
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
 * Hook to consume the measured cropper image-bounds context.
 *
 * @return Measured image bounds and setter.
 */
export function useCropperImageBoundsContext(): CropperImageBoundsContextValue {
	const context = useContext( CropperImageBoundsContext );

	if ( ! context ) {
		throw new Error(
			'useCropperImageBoundsContext must be used within a CropperProvider.'
		);
	}

	return context;
}

/**
 * Hook to optionally publish image bounds when a CropperProvider exists.
 * Standalone Cropper usage remains supported and simply skips publication.
 *
 * @return Image-bounds setter, or a no-op outside CropperProvider.
 */
export function useOptionalSetCropperImageBounds(): React.Dispatch<
	React.SetStateAction< CropperImageBounds >
> {
	const context = useContext( CropperImageBoundsContext );

	return context?.setImageBounds ?? noopSetImageBounds;
}
