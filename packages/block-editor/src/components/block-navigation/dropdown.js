/**
 * WordPress dependencies
 */
import { Button, Dropdown, SVG, Path } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockNavigation from './';

const MenuIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
		<Path d="M5 5H3v2h2V5zm3 8h11v-2H8v2zm9-8H6v2h11V5zM7 11H5v2h2v-2zm0 8h2v-2H7v2zm3-2v2h11v-2H10z" />
	</SVG>
);

function BlockNavigationDropdownToggle( { isEnabled, onToggle, isOpen } ) {
	useShortcut( 'core/edit-post/toggle-block-navigation', useCallback( onToggle, [ onToggle ] ), { bindGlobal: true, isDisabled: ! isEnabled } );
	const shortcut = useSelect( ( select ) =>
		select( 'core/keyboard-shortcuts' ).getShortcutRepresentation( 'core/edit-post/toggle-block-navigation' ), []
	);

	return (
		<Button
			icon={ MenuIcon }
			aria-expanded={ isOpen }
			onClick={ isEnabled ? onToggle : undefined }
			label={ __( 'Block navigation' ) }
			className="block-editor-block-navigation"
			shortcut={ shortcut }
			aria-disabled={ ! isEnabled }
		/>
	);
}

function BlockNavigationDropdown( { isDisabled } ) {
	const hasBlocks = useSelect( ( select ) => !! select( 'core/block-editor' ).getBlockCount(), [] );
	const isEnabled = hasBlocks && ! isDisabled;

	return	(
		<Dropdown
			contentClassName="block-editor-block-navigation__popover"
			renderToggle={ ( toggleProps ) => (
				<BlockNavigationDropdownToggle { ...toggleProps } isEnabled={ isEnabled } />
			) }
			renderContent={ ( { onClose } ) => (
				<BlockNavigation onSelect={ onClose } />
			) }
		/>
	);
}

export default BlockNavigationDropdown;
