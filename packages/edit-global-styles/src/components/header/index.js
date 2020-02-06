/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function Header() {
	return (
		<div
			className="edit-global-styles-header"
			role="region"
			aria-label={ __( 'Global styles screen top bar' ) }
			tabIndex="-1"
		>
			<h1 className="edit-global-styles-header__title">
				{ __( 'Global styles' ) } { __( '(experimental)' ) }
			</h1>
			<div className="edit-global-styles-header__actions">
				<Button isPrimary onClick={ () => {} }>
					{ __( 'Update' ) }
				</Button>
			</div>
		</div>
	);
}

export default Header;
