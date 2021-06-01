/**
 * WordPress dependencies
 */
import { Button, Dropdown } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { forwardRef } from '@wordpress/element';
import { listView } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BlockNavigationTree from './tree';
import { store as blockEditorStore } from '../../store';

function BlockNavigationDropdownToggle( {
	isEnabled,
	onToggle,
	isOpen,
	innerRef,
	...props
} ) {
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
				<div className="block-editor-block-navigation__container">
					<p className="block-editor-block-navigation__label">
						{ __( 'List view' ) }
					</p>

					<BlockNavigationTree
						showNestedBlocks
						showOnlyCurrentHierarchy
						__experimentalFeatures={ __experimentalFeatures }
					/>
				</div>
			) }
		/>
	);
}

export default forwardRef( BlockNavigationDropdown );
