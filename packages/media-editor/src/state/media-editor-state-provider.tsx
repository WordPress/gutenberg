/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { CropperState } from '../image-editor';
import {
	useMediaEditorState,
	type MediaEditorController,
} from './use-media-editor-state';
import type { CropOptionsSlice } from './types';

const MediaEditorStateContext = createContext< MediaEditorController | null >(
	null
);

interface MediaEditorStateProviderProps {
	/** Optional cropper-slice initial state. */
	initialCropperState?: Partial< CropperState >;
	/** Optional cropOptions-slice initial state. */
	initialCropOptions?: Partial< CropOptionsSlice >;
	/** Child components. */
	children: React.ReactNode;
}

/**
 * Provider that vends the composite media-editor controller via
 * context. Wrap the media editor in this so every consumer
 * (canvas, toolbar, sidebar) reads from the same store.
 *
 * @param props
 * @param props.initialCropperState
 * @param props.initialCropOptions
 * @param props.children
 */
export function MediaEditorStateProvider( {
	initialCropperState,
	initialCropOptions,
	children,
}: MediaEditorStateProviderProps ) {
	const controller = useMediaEditorState( {
		cropper: initialCropperState,
		cropOptions: initialCropOptions,
	} );

	return (
		<MediaEditorStateContext.Provider value={ controller }>
			{ children }
		</MediaEditorStateContext.Provider>
	);
}

/**
 * Consume the composite media-editor controller. Throws if used
 * outside a `<MediaEditorStateProvider>`.
 *
 * @return The composite controller.
 */
export function useMediaEditor(): MediaEditorController {
	const context = useContext( MediaEditorStateContext );
	if ( ! context ) {
		throw new Error(
			'useMediaEditor must be used within a MediaEditorStateProvider.'
		);
	}
	return context;
}
