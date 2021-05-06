/**
 * WordPress dependencies
 */
import { Button, Dropdown } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import {
	useShortcut,
	store as keyboardShortcutsStore,
} from '@wordpress/keyboard-shortcuts';
import { useCallback, forwardRef } from '@wordpress/element';
import { listView } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BlockNavigation from './';
import { store as blockEditorStore } from '../../store';

function BlockNavigationDropdownToggle( {
	isEnabled,
	onToggle,
	isOpen,
	innerRef,
	...props
} ) {
	useShortcut(
		'core/edit-post/toggle-block-navigation',
		useCallback( onToggle, [ onToggle ] ),
		{
			bindGlobal: true,
			isDisabled: ! isEnabled,
		}
	);
	const shortcut = useSelect(
		( select ) =>
			select( keyboardShortcutsStore ).getShortcutRepresentation(
				'core/edit-post/toggle-block-navigation'
			),
		[]
	);

	return (
		<Button
			{ ...props }
			ref={ innerRef }
			icon={ listView }
			aria-expanded={ isOpen }
			aria-haspopup="true"
			onClick={ isEnabled ? onToggle : undefined }
			/* translators: button label text should, if possible, be under 16 characters. */
			label={ __( 'List view' ) }
			className="block-editor-block-navigation"
			shortcut={ shortcut }
			aria-disabled={ ! isEnabled }
		/>
	);
}

function BlockNavigationDropdown(
	{ isDisabled, __experimentalFeatures, ...props },
	ref
) {
	const hasBlocks = useSelect(
		( select ) => !! select( blockEditorStore ).getBlockCount(),
		[]
	);
	const isEnabled = hasBlocks && ! isDisabled;

	return (
		<Dropdown
			contentClassName="block-editor-block-navigation__popover"
			position="bottom right"
			renderToggle={ ( { isOpen, onToggle } ) => (
				<BlockNavigationDropdownToggle
					{ ...props }
					innerRef={ ref }
					isOpen={ isOpen }
					onToggle={ onToggle }
					isEnabled={ isEnabled }
				/>
			) }
			renderContent={ () => (
				<BlockNavigation
					__experimentalFeatures={ __experimentalFeatures }
				/>
			) }
		/>
	);
}

export default forwardRef( BlockNavigationDropdown );
