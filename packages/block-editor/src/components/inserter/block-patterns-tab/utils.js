import { __, _x } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';

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

/**
 * Whether inserting a pattern adds a reference to it (a `core/block`) rather
 * than a copy of its blocks. User patterns carry a `syncStatus`; registered
 * patterns carry a `synced` flag from the REST API.
 *
 * @param {Object} pattern Pattern object.
 * @return {boolean} Whether the pattern is synced.
 */
export function isPatternSynced( pattern ) {
	if ( pattern.type === INSERTER_PATTERN_TYPES.user ) {
		return pattern.syncStatus !== INSERTER_SYNC_TYPES.unsynced;
	}
	return !! pattern.synced;
}

/**
 * Creates the `core/block` that references a synced pattern: by `ref` for a
 * user pattern, by `slug` for a registered one.
 *
 * @param {Object} pattern Pattern object.
 * @return {Object} Block object.
 */
export function createSyncedPatternBlock( pattern ) {
	return createBlock(
		'core/block',
		pattern.type === INSERTER_PATTERN_TYPES.user
			? { ref: pattern.id }
			: { slug: pattern.name }
	);
}

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
		! isPatternSynced( pattern )
	) {
		return true;
	}

	if (
		syncFilter === INSERTER_SYNC_TYPES.unsynced &&
		isPatternSynced( pattern )
	) {
		return true;
	}

	return false;
}
