/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { UseCropperStateReturn } from '../hooks/use-cropper-state';

/**
 * The context value type for the CropperProvider.
 * Contains the full return value of useCropperState.
 */
type CropperContextValue = UseCropperStateReturn | null;

const CropperContext = createContext< CropperContextValue >( null );

/**
 * Props for the CropperProvider component.
 */
interface CropperProviderProps {
	/** Cropper controller created by the image editing session. */
	value: UseCropperStateReturn;
	/** Child components. */
	children: React.ReactNode;
}

/**
 * Context provider for an existing cropper controller.
 *
 * The media editor image editing session owns the controller lifecycle; this
 * provider only makes that controller available to cropper-specific children
 * through `useCropper()`.
 *
 * @param props
 * @param props.value
 * @param props.children
 * @return The provider element wrapping children.
 */
export function CropperProvider( { value, children }: CropperProviderProps ) {
	return (
		<CropperContext.Provider value={ value }>
			{ children }
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
