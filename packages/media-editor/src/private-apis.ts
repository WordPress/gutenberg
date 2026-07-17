/**
 * Internal dependencies
 */
import { lock } from './lock-unlock';
import { store } from './store';
import { MediaEditorModal } from './components/media-editor-modal';
import { MediaEditor } from './components/media-editor';

export const privateApis = {};
lock( privateApis, {
	store,
	MediaEditor,
	MediaEditorModal,
} );
