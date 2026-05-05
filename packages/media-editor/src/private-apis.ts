/**
 * Internal dependencies
 */
import { lock } from './lock-unlock';
import { store } from './store';
import { MediaEditorModal } from './components/media-editor-modal';
import { registerImageEditorExtensionPanel } from './components/image-editor-extension-registry';

export const privateApis = {};
lock( privateApis, {
	store,
	MediaEditorModal,
	registerImageEditorExtensionPanel,
} );
