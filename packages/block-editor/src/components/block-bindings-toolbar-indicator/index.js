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
				className="block-editor__block-bindings-indicator block-toolbar__block-bindings-indicator"
			>
				<Icon icon={ connection } size={ 24 } />
			</ToolbarItem>
		</ToolbarGroup>
	);
}
