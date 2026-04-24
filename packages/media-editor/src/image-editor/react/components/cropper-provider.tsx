/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	useCropperState,
	type UseCropperStateReturn,
} from '../hooks/use-cropper-state';
import type { CropperState } from '../../core/types';

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

	return (
		<CropperContext.Provider value={ cropperReturn }>
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
