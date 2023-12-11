/**
 * WordPress dependencies
 */

import { __ } from '@wordpress/i18n';

export const PATTERN_TYPES = {
	all: 'all',
	synced: 'synced',
	unsynced: 'unsynced',
	user: 'user',
	theme: 'theme',
	directory: 'directory',
};

export const SYNC_TYPES = {
	all: 'all',
	full: 'fully',
	unsynced: 'unsynced',
};

export const allPatternsCategory = {
	name: 'allPatterns',
	label: __( 'All' ),
};

export const myPatternsCategory = {
	name: 'myPatterns',
	label: __( 'My patterns' ),
};

export function isPatternFiltered( pattern, sourceFilter, syncFilter ) {
	const isUserPattern = pattern.name.startsWith( 'core/block' );
	const isDirectoryPattern =
		pattern.source === 'core' ||
		pattern.source?.startsWith( 'pattern-directory' );

	// If theme source selected, filter out user created patterns and those from
	// the core patterns directory.
	if (
		sourceFilter === PATTERN_TYPES.theme &&
		( isUserPattern || isDirectoryPattern )
	) {
		return true;
	}

	// If the directory source is selected, filter out user created patterns
	// and those bundled with the theme.
	if (
		sourceFilter === PATTERN_TYPES.directory &&
		( isUserPattern || ! isDirectoryPattern )
	) {
		return true;
	}

	// If user source selected, filter out theme patterns.
	if (
		sourceFilter === PATTERN_TYPES.user &&
		pattern.type !== PATTERN_TYPES.user
	) {
		return true;
	}

	// Filter by sync status.
	if ( syncFilter === SYNC_TYPES.full && pattern.syncStatus !== '' ) {
		return true;
	}

	if (
		syncFilter === SYNC_TYPES.unsynced &&
		pattern.syncStatus !== 'unsynced' &&
		isUserPattern
	) {
		return true;
	}

	return false;
}
