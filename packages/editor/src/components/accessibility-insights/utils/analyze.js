/**
 * Internal dependencies
 */
import {
	checkAltText,
	checkHeadingHierarchy,
	checkLinkText,
	checkEmptyHeadings,
} from './checks';

/**
 * @typedef {import('./types').AccessibilityIssue} AccessibilityIssue
 * @typedef {import('./types').BlockLike} BlockLike
 * @typedef {import('./types').GroupedIssues} GroupedIssues
 * @typedef {import('./types').IssueCounts} IssueCounts
 */

/**
 * Category display names for UI.
 */
export const CATEGORY_LABELS = {
	'alt-text': 'Missing Alt Text',
	'heading-hierarchy': 'Heading Hierarchy',
	'link-text': 'Link Text',
	'empty-heading': 'Empty Headings',
};

/**
 * Runs all accessibility checks on the given blocks.
 *
 * @param {BlockLike[]} blocks - Array of blocks to analyze
 * @return {AccessibilityIssue[]} Array of all issues found, sorted by severity
 */
export function getAccessibilityIssues( blocks ) {
	if ( ! blocks || ! Array.isArray( blocks ) ) {
		return [];
	}

	// Run all checks
	const allIssues = [
		...checkAltText( blocks ),
		...checkHeadingHierarchy( blocks ),
		...checkLinkText( blocks ),
		...checkEmptyHeadings( blocks ),
	];

	// Sort issues: errors first, then warnings
	return allIssues.sort( ( a, b ) => {
		if ( a.type === 'error' && b.type === 'warning' ) {
			return -1;
		}
		if ( a.type === 'warning' && b.type === 'error' ) {
			return 1;
		}
		return 0;
	} );
}

/**
 * Groups issues by category.
 *
 * @param {AccessibilityIssue[]} issues - Array of issues to group
 * @return {GroupedIssues} Issues grouped by category
 */
export function groupIssuesByCategory( issues ) {
	if ( ! issues || ! Array.isArray( issues ) ) {
		return {};
	}

	return issues.reduce( ( groups, issue ) => {
		const { category } = issue;
		if ( ! groups[ category ] ) {
			groups[ category ] = [];
		}
		groups[ category ].push( issue );
		return groups;
	}, {} );
}

/**
 * Counts issues by severity type.
 *
 * @param {AccessibilityIssue[]} issues - Array of issues to count
 * @return {IssueCounts} Counts of errors, warnings, and total
 */
export function countIssues( issues ) {
	if ( ! issues || ! Array.isArray( issues ) ) {
		return { errors: 0, warnings: 0, total: 0 };
	}

	const errors = issues.filter( ( issue ) => issue.type === 'error' ).length;
	const warnings = issues.filter(
		( issue ) => issue.type === 'warning'
	).length;

	return {
		errors,
		warnings,
		total: issues.length,
	};
}

/**
 * Gets a human-readable label for a category.
 *
 * @param {string} category - The category key
 * @return {string} Human-readable label
 */
export function getCategoryLabel( category ) {
	return CATEGORY_LABELS[ category ] || category;
}
