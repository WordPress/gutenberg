import { createContext, useContext } from '@wordpress/element';
import {
	useMediaEditorState,
	type MediaEditorSession,
} from './use-media-editor-state';

const MediaEditorStateContext = createContext< MediaEditorSession | null >(
	null
);

interface MediaEditorStateProviderProps {
	/** Child components. */
	children: React.ReactNode;
}

/**
 * Provider that vends the media editor session via context. Wrap
 * the media editor in this so every consumer (canvas, toolbar,
 * sidebar) reads from the same store.
 *
 * @param props
 * @param props.children
 */
export function MediaEditorStateProvider( {
	children,
}: MediaEditorStateProviderProps ) {
	const controller = useMediaEditorState();

	return (
		<MediaEditorStateContext.Provider value={ controller }>
			{ children }
		</MediaEditorStateContext.Provider>
	);
}

/**
 * Consume the media editor session. Throws if used
 * outside a `<MediaEditorStateProvider>`.
 *
 * @return The media editor session.
 */
export function useMediaEditor(): MediaEditorSession {
	const context = useContext( MediaEditorStateContext );
	if ( ! context ) {
		throw new Error(
			'useMediaEditor must be used within a MediaEditorStateProvider.'
		);
	}
	return context;
}
