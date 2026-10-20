import { __, _x } from '@wordpress/i18n';

export const INSERTER_PATTERN_TYPES = {
	user: 'user',
	theme: 'theme',
	directory: 'directory',
	installedTheme: 'installed-theme',
};

export const INSERTER_SYNC_TYPES = {
	full: 'fully',
	unsynced: 'unsynced',
};

export const allPatternsCategory = {
	name: 'allPatterns',
	label: _x( 'All', 'patterns' ),
};

export const myPatternsCategory = {
	name: 'myPatterns',
	label: __( 'My patterns' ),
};

export const starterPatternsCategory = {
	name: 'core/starter-content',
	label: __( 'Starter content' ),
};

export const otherCategoriesCategory = {
	name: 'otherCategories',
	label: __( 'Other categories' ),
};

function hasRegisteredCategory( pattern, allCategories ) {
	if ( ! pattern.categories || ! pattern.categories.length ) {
		return false;
	}

	return pattern.categories.some( ( cat ) =>
		allCategories.some( ( category ) => category.name === cat )
	);
}

/**
 * Returns whether a pattern belongs to "Other categories": it comes from an
 * installed theme other than the active one, and only uses categories that
 * theme registers. Those categories are only registered while the theme is
 * active.
 *
 * @param {Object} pattern       The pattern.
 * @param {Array}  allCategories The registered pattern categories.
 *
 * @return {boolean} Whether the pattern belongs to "Other categories".
 */
export function isInOtherCategories( pattern, allCategories ) {
	return (
		pattern.type === INSERTER_PATTERN_TYPES.installedTheme &&
		!! pattern.categories?.length &&
		! hasRegisteredCategory( pattern, allCategories )
	);
}

/**
 * Returns whether a pattern belongs to no category, so it shows in
 * "Uncategorized".
 *
 * @param {Object} pattern       The pattern.
 * @param {Array}  allCategories The registered pattern categories.
 *
 * @return {boolean} Whether the pattern is uncategorized.
 */
export function isUncategorized( pattern, allCategories ) {
	return (
		! hasRegisteredCategory( pattern, allCategories ) &&
		! isInOtherCategories( pattern, allCategories )
	);
}

/**
 * Returns the categories that contain at least one of the given patterns,
 * sorted by label. "Uncategorized" and "Other categories" are appended when
 * some pattern belongs to them.
 *
 * @param {Array} patterns      The patterns to derive the categories from.
 * @param {Array} allCategories The registered pattern categories.
 *
 * @return {Array} The populated categories.
 */
export function getPopulatedCategories( patterns, allCategories ) {
	const categories = allCategories
		.filter( ( category ) =>
			patterns.some( ( pattern ) =>
				pattern.categories?.includes( category.name )
			)
		)
		.sort( ( a, b ) => a.label.localeCompare( b.label ) );

	if (
		patterns.some( ( pattern ) =>
			isUncategorized( pattern, allCategories )
		) &&
		! categories.find( ( category ) => category.name === 'uncategorized' )
	) {
		categories.push( {
			name: 'uncategorized',
			label: __( 'Uncategorized' ),
		} );
	}

	if (
		patterns.some( ( pattern ) =>
			isInOtherCategories( pattern, allCategories )
		)
	) {
		categories.push( otherCategoriesCategory );
	}

	return categories;
}

export function isPatternFiltered( pattern, sourceFilter, syncFilter ) {
	// Patterns from other installed themes only match their own source.
	const isInstalledThemePattern =
		pattern.type === INSERTER_PATTERN_TYPES.installedTheme;
	if ( sourceFilter === INSERTER_PATTERN_TYPES.installedTheme ) {
		return ! isInstalledThemePattern;
	}
	if ( sourceFilter !== 'all' && isInstalledThemePattern ) {
		return true;
	}

	const isUserPattern = pattern.name.startsWith( 'core/block' );
	const isDirectoryPattern =
		pattern.source === 'core' ||
		pattern.source?.startsWith( 'pattern-directory' );

	// If theme source selected, filter out user created patterns and those from
	// the core patterns directory.
	if (
		sourceFilter === INSERTER_PATTERN_TYPES.theme &&
		( isUserPattern || isDirectoryPattern )
	) {
		return true;
	}

	// If the directory source is selected, filter out user created patterns
	// and those bundled with the theme.
	if (
		sourceFilter === INSERTER_PATTERN_TYPES.directory &&
		( isUserPattern || ! isDirectoryPattern )
	) {
		return true;
	}

	// If user source selected, filter out theme patterns.
	if (
		sourceFilter === INSERTER_PATTERN_TYPES.user &&
		pattern.type !== INSERTER_PATTERN_TYPES.user
	) {
		return true;
	}

	// Filter by sync status.
	if (
		syncFilter === INSERTER_SYNC_TYPES.full &&
		pattern.syncStatus !== ''
	) {
		return true;
	}

	if (
		syncFilter === INSERTER_SYNC_TYPES.unsynced &&
		pattern.syncStatus !== 'unsynced' &&
		isUserPattern
	) {
		return true;
	}

	return false;
}
