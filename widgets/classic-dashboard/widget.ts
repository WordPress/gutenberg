/**
 * WordPress dependencies
 */
import { plugins } from '@wordpress/icons';

/**
 * Shared metadata for the classic dashboard widget render module.
 * Individual classic types override `title` via the REST API.
 */
export default {
	name: 'wp-classic/classic-dashboard',
	title: 'Classic Dashboard Widget',
	icon: plugins,
	category: 'classic',
};
