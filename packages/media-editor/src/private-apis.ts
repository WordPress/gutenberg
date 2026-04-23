/**
 * Internal dependencies
 */
import { lock } from './lock-unlock';
import { store } from './store';
import { MediaEditorModal } from './components/media-editor-modal';

export const privateApis = {};
lock( privateApis, {
	store,
	MediaEditorModal,
} );
