/**
 * WordPress dependencies
 */
import { ToolbarItem, ToolbarGroup, Icon } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { connection } from '@wordpress/icons';
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

export default function BlockBindingsIndicator( { clientId } ) {
	const isConnected = useSelect(
		( select ) => {
			const attributes =
				select( blockEditorStore ).getBlockAttributes( clientId );

			return !! attributes?.metadata?.bindings;
		},
		[ clientId ]
	);

	return isConnected ? (
		<ToolbarGroup>
			<ToolbarItem
				as={ 'div' }
				aria-label={ _x( 'Connected', 'block toolbar button label' ) }
				className="block-editor-block-bindings-indicator"
			>
				<Icon icon={ connection } size={ 24 } />
			</ToolbarItem>
		</ToolbarGroup>
	) : null;
}
