/**
 * WordPress dependencies
 */
import { useState, useCallback } from '@wordpress/element';

/**
 * Hook that manages the HEIC upload prompt state.
 *
 * Returns the prompt state (files and retry callback) and an
 * `onHeicPluginRequired` callback to be passed into the upload-media store settings.
 *
 * @return {Object} Object with heicPromptState, onHeicPluginRequired, and dismissHeicPrompt.
 */
export default function useHeicUploadPrompt() {
	const [ heicPromptState, setHeicPromptState ] = useState( null );

	const onHeicPluginRequired = useCallback( ( files, retry ) => {
		setHeicPromptState( { files, retry } );
	}, [] );

	const dismissHeicPrompt = useCallback( () => {
		setHeicPromptState( null );
	}, [] );

	return {
		heicPromptState,
		onHeicPluginRequired,
		dismissHeicPrompt,
	};
}
