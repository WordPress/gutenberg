/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton, Dropdown, MenuItemsSeparator } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import ModeSwitcher from '../mode-switcher';
import FixedToolbarToggle from '../fixed-toolbar-toggle';
import EditorActions from '../editor-actions';
import Plugins from '../plugins';

const element = (
	<Dropdown
		className="edit-post-ellipsis-menu"
		position="bottom left"
		renderToggle={ ( { isOpen, onToggle } ) => (
			<IconButton
				icon="ellipsis"
				label={ __( 'More' ) }
				onClick={ onToggle }
				aria-expanded={ isOpen }
			/>
		) }
		renderContent={ ( { onClose } ) => (
			<div>
				<ModeSwitcher onSelect={ onClose } />
				<MenuItemsSeparator />
				<FixedToolbarToggle onToggle={ onClose } />
				{ /* Plugins component renders its own divider, because it may not show. */ }
				<Plugins onSelect={ onClose } />
				<MenuItemsSeparator />
				<EditorActions />
			</div>
		) }
	/>
);

/**
 * Returns the EllipsisMenu component.
 *
 * @returns {ReactElement} The EllipsisMenu component.
 */
function EllipsisMenu() {
	return element;
}

export default EllipsisMenu;
