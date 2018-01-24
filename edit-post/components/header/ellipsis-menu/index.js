/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton, Dropdown } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import ModeSwitcher from '../mode-switcher';
import FixedToolbarToggle from '../fixed-toolbar-toggle';
import EditorActions from '../editor-actions';

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
				<div className="edit-post-ellipsis-menu__separator" />
				<FixedToolbarToggle onToggle={ onClose } />
				<div className="edit-post-ellipsis-menu__separator" />
				<EditorActions />
			</div>
		) }
	/>
);

function EllipsisMenu() {
	return element;
}

export default EllipsisMenu;
