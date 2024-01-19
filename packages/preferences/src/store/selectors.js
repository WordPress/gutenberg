/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

const withDeprecatedKeys = ( originalGet ) => ( state, scope, name ) => {
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

		const value = originalGet( state, 'core', name );

		// Hotfix for 17.5. Some of the preferences in the list above haven't been
		// migrated to core in 17.5 (i.e: `editorMode`, https://github.com/WordPress/gutenberg/pull/57642))
		// so we should fallback to the passed scope to avoid unexpected `undefined` values.
		if ( value === undefined ) {
			return originalGet( state, scope, name );
		}

		return originalGet( state, 'core', name );
	}

	return originalGet( state, scope, name );
};

/**
 * Returns a boolean indicating whether a prefer is active for a particular
 * scope.
 *
 * @param {Object} state The store state.
 * @param {string} scope The scope of the feature (e.g. core/edit-post).
 * @param {string} name  The name of the feature.
 *
 * @return {*} Is the feature enabled?
 */
export const get = withDeprecatedKeys( ( state, scope, name ) => {
	const value = state.preferences[ scope ]?.[ name ];
	return value !== undefined ? value : state.defaults[ scope ]?.[ name ];
} );
