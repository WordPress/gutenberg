import type { ScopePreferences, ScopedPreferences } from '../../types';

// Leaves a scope that is not an object, such as a corrupt string, untouched.
function copyScope( scope: unknown ): ScopePreferences | undefined {
	return scope && typeof scope === 'object' && ! Array.isArray( scope )
		? { ...scope }
		: undefined;
}

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
				...newData.core,
				[ setting ]: editPost[ setting ],
			};
			delete editPost[ setting ];
		}

		if ( editSite?.[ setting ] !== undefined ) {
			delete editSite[ setting ];
		}
	} );

	if ( editPost ) {
		if ( Object.keys( editPost ).length === 0 ) {
			delete newData[ 'core/edit-post' ];
		} else {
			newData[ 'core/edit-post' ] = editPost;
		}
	}

	if ( editSite ) {
		if ( Object.keys( editSite ).length === 0 ) {
			delete newData[ 'core/edit-site' ];
		} else {
			newData[ 'core/edit-site' ] = editSite;
		}
	}

	return newData;
}
