/**
 * Internal dependencies
 */
import { ExperimentalEditorProvider } from './components/provider';
import { lock } from './lockUnlock';
import { EntitiesSavedStatesExtensible } from './components/entities-saved-states';
import getFeaturedMediaDetails from './components/post-featured-image/get-featured-media-details';

export const privateApis = {};
lock( privateApis, {
	ExperimentalEditorProvider,
	EntitiesSavedStatesExtensible,
	getFeaturedMediaDetails,
} );
