/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { NavigableMenu } from '@wordpress/components';

/**
 * Internal dependencies
 */
import Inserter from '../inserter';
import SaveButton from '../save-button';

function Header() {
	return (
		<div
			className="edit-widgets-header"
			role="region"
			aria-label={ __( 'Widgets screen top bar' ) }
			tabIndex="-1"
		>
			<NavigableMenu>
				<Inserter.Slot />
			</NavigableMenu>
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
