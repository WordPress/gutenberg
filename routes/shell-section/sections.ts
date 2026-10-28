import { __ } from '@wordpress/i18n';

/**
 * The admin screens the site shell's menu points at. Each is a placeholder
 * until it is given real content.
 *
 * @return Screen titles, keyed by the path segment.
 */
export function getSectionTitles(): Record< string, string > {
	return {
		dashboard: __( 'Dashboard' ),
		posts: __( 'Posts' ),
		pages: __( 'Pages' ),
		media: __( 'Media' ),
		comments: __( 'Comments' ),
		styles: __( 'Styles' ),
		templates: __( 'Templates' ),
		'template-parts': __( 'Template Parts' ),
		patterns: __( 'Patterns' ),
		navigation: __( 'Navigation' ),
		plugins: __( 'Plugins' ),
		users: __( 'Users' ),
		settings: __( 'Settings' ),
	};
}
