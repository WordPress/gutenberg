/**
 * WordPress dependencies
 */
import { Button, Dropdown, SVG, Path } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { useCallback, forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockNavigation from './';

const MenuIcon = (
	<SVG
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		width="24"
		height="24"
	>
		<Path d="M13.8 5.2H3v1.5h10.8V5.2zm-3.6 12v1.5H21v-1.5H10.2zm7.2-6H6.6v1.5h10.8v-1.5z" />
	</SVG>
);

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
			select( 'core/keyboard-shortcuts' ).getShortcutRepresentation(
				'core/edit-post/toggle-block-navigation'
			),
		[]
	);

	return (
		<Button
			{ ...props }
			ref={ innerRef }
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

function BlockNavigationDropdown(
	{ isDisabled, __experimentalFeatures, ...props },
	ref
) {
	const hasBlocks = useSelect(
		( select ) => !! select( 'core/block-editor' ).getBlockCount(),
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
			renderContent={ ( { onClose } ) => (
				<BlockNavigation
					onSelect={ onClose }
					__experimentalFeatures={ __experimentalFeatures }
				/>
			) }
		/>
	);
}

export default forwardRef( BlockNavigationDropdown );
