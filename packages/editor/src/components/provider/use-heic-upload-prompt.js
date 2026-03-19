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
 * @return {Object} The hook return value.
 * @return {Object|null} return.heicPromptState  The current prompt state or null.
 * @return {Function}    return.onHeicPluginRequired Callback for the upload-media store.
 * @return {Function}    return.dismissHeicPrompt    Callback to dismiss the prompt.
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
