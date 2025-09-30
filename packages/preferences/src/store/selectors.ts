/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
/**
 * Internal dependencies
 */
import type { StoreState } from './types';

const withDeprecatedKeys =
	(
		originalGet: ( state: StoreState, scope: string, name: string ) => any
	) =>
	( state: StoreState, scope: string, name: string ) => {
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

		if (
			settingsToMoveToCore.includes( name ) &&
			[ 'core/edit-post', 'core/edit-site' ].includes( scope )
		) {
			deprecated(
				`wp.data.select( 'core/preferences' ).get( '${ scope }', '${ name }' )`,
				{
					since: '6.5',
					alternative: `wp.data.select( 'core/preferences' ).get( 'core', '${ name }' )`,
				}
			);

			return originalGet( state, 'core', name );
		}

		return originalGet( state, scope, name );
	};

/**
 * Returns a boolean indicating whether a prefer is active for a particular
 * scope.
 *
 * @param {StoreState} state The store state.
 * @param {string}     scope The scope of the feature (e.g. core/edit-post).
 * @param {string}     name  The name of the feature.
 *
 * @return {*} Is the feature enabled?
 */
export const get = withDeprecatedKeys(
	( state: StoreState, scope: string, name: string ) => {
		const value = state.preferences[ scope ]?.[ name ];
		return value !== undefined ? value : state.defaults[ scope ]?.[ name ];
	}
);
