import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { SwitchControl } from '@wordpress/ui';

const META_KEY = 'wp_navigation_auto_add_pages';

type NavigationMenuMeta = Record< string, unknown > & {
	[ META_KEY ]?: boolean;
};

type Props = {
	/** The `wp_navigation` post the block displays. */
	menuId: number;
	dropdownMenuProps?: React.ComponentProps<
		typeof ToolsPanel
	>[ 'dropdownMenuProps' ];
};

/**
 * Settings that belong to the Navigation Menu rather than to the block, so
 * they are read from and written to the `wp_navigation` entity and saved with
 * it.
 *
 * @param props
 * @param props.menuId
 * @param props.dropdownMenuProps
 */
export default function AutoAddPagesControl( {
	menuId,
	dropdownMenuProps,
}: Props ) {
	const [ meta, setMeta ] = useEntityProp(
		'postType',
		'wp_navigation',
		'meta',
		menuId
	) as unknown as [
		NavigationMenuMeta | undefined,
		( meta: NavigationMenuMeta ) => void,
	];
	const isEnabled = !! meta?.[ META_KEY ];
	const setEnabled = ( value: boolean ) =>
		setMeta( { ...meta, [ META_KEY ]: value } );

	return (
		<ToolsPanel
			label={ __( 'Menu' ) }
			resetAll={ () => setEnabled( false ) }
			dropdownMenuProps={ dropdownMenuProps }
		>
			<ToolsPanelItem
				hasValue={ () => isEnabled }
				label={ __( 'Auto add pages' ) }
				onDeselect={ () => setEnabled( false ) }
				isShownByDefault
			>
				<SwitchControl
					label={ __( 'Auto add pages' ) }
					description={ __(
						'Add a link to each new top-level page when it is published.'
					) }
					checked={ isEnabled }
					onCheckedChange={ setEnabled }
				/>
			</ToolsPanelItem>
		</ToolsPanel>
	);
}
