/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export default function CustomizedTemplateInfo( { template } ) {
	// Template originally provided by a theme, but customized by a user.
	// Templates originally didn't have the 'origin' field so identify
	// older customized templates by checking for no origin and a 'theme'
	// or 'custom' source.
	if (
		template.author &&
		template.has_theme_file &&
		( template.origin === 'theme' ||
			( ! template.origin &&
				[ 'theme', 'custom' ].includes( template.source ) ) ||
			template.origin === 'plugin' )
	) {
		return (
			<p className="edit-site-list-template-customized-info">
				{ __( 'This template has been customized.' ) }
			</p>
		);
	}

	return null;
}
