import { __, _x } from '@wordpress/i18n';
import type { BlockPattern } from '../../../store/types';
import type { PatternCategory } from '../types';

// The literal types name the pattern types.
export const INSERTER_PATTERN_TYPES = {
	user: 'user',
	theme: 'theme',
	directory: 'directory',
} as const;

// The literal types name the sync types.
export const INSERTER_SYNC_TYPES = {
	full: 'fully',
	unsynced: 'unsynced',
} as const;

export const INSERTER_AUTHOR_TYPES = {
	currentUser: 'currentUser',
};

export const allPatternsCategory: PatternCategory = {
	name: 'allPatterns',
	label: _x( 'All', 'patterns' ),
};

export const sitePatternsCategory: PatternCategory = {
	name: 'sitePatterns',
	label: __( 'Site patterns' ),
};

export const starterPatternsCategory: PatternCategory = {
	name: 'core/starter-content',
	label: __( 'Starter content' ),
};

function hasRegisteredCategory(
	pattern: BlockPattern,
	allCategories: PatternCategory[]
) {
	if ( ! pattern.categories || ! pattern.categories.length ) {
		return false;
	}

	return pattern.categories.some( ( cat ) =>
		allCategories.some( ( category ) => category.name === cat )
	);
}

/**
 * Returns the categories that contain at least one of the given patterns,
 * sorted by label. An "Uncategorized" category is appended when some pattern
 * belongs to no registered category.
 *
 * @param patterns      The patterns to derive the categories from.
 * @param allCategories The registered pattern categories.
 *
 * @return The populated categories.
 */
export function getPopulatedCategories(
	patterns: BlockPattern[],
	allCategories: PatternCategory[]
): PatternCategory[] {
	const categories = allCategories
		.filter( ( category ) =>
			patterns.some( ( pattern ) =>
				pattern.categories?.includes( category.name )
			)
		)
		.sort( ( a, b ) => a.label.localeCompare( b.label ) );

	if (
		patterns.some(
			( pattern ) => ! hasRegisteredCategory( pattern, allCategories )
		) &&
		! categories.find( ( category ) => category.name === 'uncategorized' )
	) {
		categories.push( {
			name: 'uncategorized',
			label: __( 'Uncategorized' ),
		} );
	}

	return categories;
}

export function isPatternFiltered(
	pattern: BlockPattern,
	sourceFilter: string,
	syncFilter?: string,
	authorFilter?: string
): boolean {
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

	// If the current user's patterns are selected, filter out everyone else's.
	if (
		authorFilter === INSERTER_AUTHOR_TYPES.currentUser &&
		! pattern.isCurrentUserPattern
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
