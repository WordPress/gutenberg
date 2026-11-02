import { lock } from './lock-unlock';
import { store } from './store';
import { MediaEditorModal } from './components/media-editor-modal';
import { buildModifiers } from './components/media-editor-modal/build-modifiers';
import { MediaEditor } from './components/media-editor';
import {
	Cropper,
	useCropperController,
	getSourceRegion,
	getSourceRegionPercent,
} from './image-editor';

export const privateApis = {};
lock( privateApis, {
	store,
	MediaEditor,
	MediaEditorModal,
	Cropper,
	useCropperController,
	getSourceRegion,
	getSourceRegionPercent,
	buildModifiers,
} );
