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

	// Check if setting is in the list and scope is either 'core/edit-post' or 'core/edit-site'
	if (
		settingsToMoveToCore.includes( name ) &&
		[ 'core/edit-post', 'core/edit-site' ].includes( scope )
	) {
		const value = originalGet( state, 'core', name );

		// If the value is found in the 'core' scope, return it and show deprecation message
		if ( value !== undefined ) {
			deprecated(
				`wp.data.select( 'core/preferences' ).get( '${ scope }', '${ name }' )`,
				{
					since: '6.5',
					alternative: `wp.data.select( 'core/preferences' ).get( 'core', '${ name }' )`,
				}
			);

			return value;
		}

		// If the value is not found in the 'core' scope, return it from the original scope without deprecation message
	}

	// Fallback to original scope for other cases
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
