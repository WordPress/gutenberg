/**
 * WordPress dependencies
 */
import { ToolbarItem, ToolbarGroup, Icon } from '@wordpress/components';
import { connection } from '@wordpress/icons';
import { _x } from '@wordpress/i18n';

export default function BlockBindingsToolbarIndicator() {
	return (
		<ToolbarGroup>
			<ToolbarItem
				as={ 'div' }
				aria-label={ _x( 'Connected', 'block toolbar button label' ) }
				className="block-editor-block-bindings-toolbar-indicator"
			>
				<Icon icon={ connection } size={ 24 } />
			</ToolbarItem>
		</ToolbarGroup>
	);
}
