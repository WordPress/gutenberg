/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export default function Header() {
	return (
		<div
			className="edit-site-header"
			role="region"
			aria-label={ __( 'Site editor top bar.' ) }
			tabIndex="-1"
		>
			<h1 className="edit-site-header__title">
				{ __( 'Site Editor' ) } { __( '(beta)' ) }
			</h1>
		</div>
	);
}
