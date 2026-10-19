import isPreferencesData from '../../is-preferences-data';
import type { ScopedPreferences } from '../../types';

const copyScope = ( scope: unknown ) =>
	isPreferencesData( scope ) ? { ...scope } : undefined;

export default function convertEditorSettings( data: ScopedPreferences ) {
	const newData = { ...data };
	const editPost = copyScope( data[ 'core/edit-post' ] );
	const editSite = copyScope( data[ 'core/edit-site' ] );
	const settingsToMoveToCore = [
		'allowRightClickOverrides',
		'distractionFree',
		'editorMode',
		'fixedToolbar',
		'focusMode',
		'hiddenBlockTypes',
		'inactivePanels',
		'keepCaretInsideBlock',
		'mostUsedBlocks',
		'openPanels',
		'showBlockBreadcrumbs',
		'showIconLabels',
		'showListViewByDefault',
		'isPublishSidebarEnabled',
		'isComplementaryAreaVisible',
		'pinnedItems',
	];

	settingsToMoveToCore.forEach( ( setting ) => {
		if ( editPost?.[ setting ] !== undefined ) {
			newData.core = {
				...copyScope( newData.core ),
				[ setting ]: editPost[ setting ],
			};
			delete editPost[ setting ];
		}

		if ( editSite?.[ setting ] !== undefined ) {
			delete editSite[ setting ];
		}
	} );

	// Empty and invalid scopes are removed rather than persisted.
	if ( editPost && Object.keys( editPost ).length > 0 ) {
		newData[ 'core/edit-post' ] = editPost;
	} else {
		delete newData[ 'core/edit-post' ];
	}

	if ( editSite && Object.keys( editSite ).length > 0 ) {
		newData[ 'core/edit-site' ] = editSite;
	} else {
		delete newData[ 'core/edit-site' ];
	}

	return newData;
}
