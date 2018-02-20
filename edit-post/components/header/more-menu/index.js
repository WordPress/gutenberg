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

const MoreMenu = () => (
	<Dropdown
		className="edit-post-more-menu"
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
			<div className="edit-post-more-menu__content">
				<ModeSwitcher onSelect={ onClose } />
				<FixedToolbarToggle onToggle={ onClose } />
				<EditorActions />
			</div>
		) }
	/>
);

export default MoreMenu;
