import browserslist from 'browserslist';
import wordpressBrowserslistConfig from '@wordpress/browserslist-config';

/**
 * Resolve the Browserslist queries for a project.
 *
 * Uses the project's own config if one is present, otherwise falling back to
 * `@wordpress/browserslist-config` instead of Browserslist's implicit defaults.
 *
 * @return {string[]} Browserslist queries.
 */
export function getBrowserslistQueries() {
	const config = browserslist.findConfig( process.cwd() );
	return config?.defaults || wordpressBrowserslistConfig;
}
