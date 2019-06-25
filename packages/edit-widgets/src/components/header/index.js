/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SaveButton from '../save-button';

function Header() {
	return (
		<div
			className="edit-widgets-header"
			role="region"
			aria-label={ __( 'Widgets screen top bar' ) }
			tabIndex="-1"
		>
			<h1 className="edit-widgets-header__title">
				{ __( 'Block Areas' ) } { __( '(experimental)' ) }
			</h1>

			<div className="edit-widgets-header__actions">
				<SaveButton />
			</div>
		</div>
	);
}

export default Header;
