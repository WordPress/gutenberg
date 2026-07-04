/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	useCropperReducer,
	type CropperController,
} from '../hooks/use-cropper-reducer';
import type { CropperState } from '../../core/types';

/**
 * The context value type for the CropperProvider.
 * Contains the cropper controller from useCropperReducer.
 */
type CropperContextValue = CropperController | null;

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
 * Convenience context provider that wraps `useCropperReducer`.
 *
 * Provides the pure cropper controller (state + setters, NO undo
 * history) to all descendant components via React context.
 *
 * History is a higher-layer concern owned by composite stores
 * (see `useMediaEditorState` in media-editor/state for the media
 * editor's composite controller with undo/redo).
 *
 * @param props
 * @param props.initialState
 * @param props.children
 * @return The provider element wrapping children.
 */
export function CropperProvider( {
	initialState,
	children,
}: CropperProviderProps ) {
	const cropperReturn = useCropperReducer( initialState );

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
 * @return The cropper controller.
 */
export function useCropper(): CropperController {
	const context = useContext( CropperContext );

	if ( ! context ) {
		throw new Error( 'useCropper must be used within a CropperProvider.' );
	}

	return context;
}
