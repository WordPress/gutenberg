/**
 * Internal dependencies
 */
import { lock } from './lock-unlock';
import { store } from './store';
import { MediaEditorModal } from './components/media-editor-modal';
import { MediaEditor } from './components/media-editor';
import { registerImageEditorExtensionPanel } from './components/image-editor-extension-registry';

export const privateApis = {};
lock( privateApis, {
	store,
	MediaEditor,
	MediaEditorModal,
	registerImageEditorExtensionPanel,
} );
