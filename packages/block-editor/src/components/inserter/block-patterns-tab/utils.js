/**
 * WordPress dependencies
 */

import { __, _x } from '@wordpress/i18n';

export const INSERTER_PATTERN_TYPES = {
	user: 'user',
	theme: 'theme',
	directory: 'directory',
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

export function isPatternFiltered( pattern, sourceFilter, syncFilter ) {
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
