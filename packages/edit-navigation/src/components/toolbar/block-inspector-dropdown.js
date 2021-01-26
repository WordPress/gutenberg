/**
 * WordPress dependencies
 */
import { Dropdown, Button } from '@wordpress/components';
import { cog } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { BlockInspector } from '@wordpress/block-editor';

export default function BlockInspectorDropdown() {
	return (
		<Dropdown
			contentClassName={ 'edit-navigation-toolbar__component-popover' }
			position="bottom left"
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button
					icon={ cog }
					isPressed={ isOpen }
					label={ __( 'Block inspector' ) }
					aria-expanded={ isOpen }
					onClick={ onToggle }
				/>
			) }
			renderContent={ () => (
				<BlockInspector bubblesVirtually={ false } />
			) }
		/>
	);
}
