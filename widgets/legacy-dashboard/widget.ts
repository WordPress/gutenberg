/**
 * WordPress dependencies
 */
import { plugins } from '@wordpress/icons';

/**
 * Shared metadata for the legacy dashboard widget render module.
 * Individual legacy types override `title` via the REST API.
 */
export default {
	name: 'wp-legacy/legacy-dashboard',
	title: 'Legacy Dashboard Widget',
	icon: plugins,
	category: 'legacy',
};
