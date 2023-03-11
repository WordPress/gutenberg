/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export default function Header() {
	return (
		<div className="onboarding__sidebar-header">
			{ __( "I'm the header of the sidebar" ) }
		</div>
	);
}
