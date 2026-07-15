/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as uploadStore } from '@wordpress/upload-media';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { GifConversionPrompt } from '../gif-conversion-prompt';

/**
 * Maps an upload prompt `type` to the component that renders it. This is the
 * seam a general upload/drag-and-drop prompt would extend: a new prompt type
 * registers its component here and triggers itself with requestUploadPrompt().
 */
const PROMPT_COMPONENTS = {
	'gif-conversion': GifConversionPrompt,
};

/**
 * Whether any upload prompt is currently awaiting the user's answer.
 *
 * Shared with the upload progress snackbar, which stays hidden while a prompt
 * is open so the prompt is the single point of attention.
 *
 * @return {boolean} Whether a prompt is open.
 */
export function useHasActiveUploadPrompt() {
	return useSelect(
		( select ) =>
			unlock( select( uploadStore ) ).getUploadPrompts().length > 0,
		[]
	);
}

/**
 * Renders the pending upload prompts: modals asking the user to decide
 * something about an upload (currently only whether to convert a dropped
 * animated GIF to a video).
 *
 * Generic host: the upload flow triggers a prompt with requestUploadPrompt(),
 * and each prompt's `type` selects the component that renders it. Unknown
 * types are ignored so an older editor never breaks on a newer prompt type.
 */
export default function UploadPromptHost() {
	const prompts = useSelect(
		( select ) => unlock( select( uploadStore ) ).getUploadPrompts(),
		[]
	);

	return prompts.map( ( prompt ) => {
		const Component = PROMPT_COMPONENTS[ prompt.type ];
		return Component ? (
			<Component key={ prompt.id } prompt={ prompt } />
		) : null;
	} );
}
