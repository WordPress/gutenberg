import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { SwitchControl } from '@wordpress/ui';

const META_KEY = 'wp_navigation_auto_add_pages';

type NavigationMenuRecord = {
	meta?: Record< string, unknown >;
};

type Props = {
	/** The `wp_navigation` post the block displays. */
	menuId: number;
	dropdownMenuProps?: React.ComponentProps<
		typeof ToolsPanel
	>[ 'dropdownMenuProps' ];
};

/**
 * The menu's "Auto add pages" setting.
 *
 * It belongs to the Navigation Menu rather than to the block, so a change is
 * an edit to the menu record and is saved along with the block's other menu
 * edits.
 *
 * @param props
 * @param props.menuId
 * @param props.dropdownMenuProps
 */
export default function AutoAddPagesControl( {
	menuId,
	dropdownMenuProps,
}: Props ) {
	const isEnabled = useSelect(
		( select ) => {
			const record = select( coreStore ).getEditedEntityRecord(
				'postType',
				'wp_navigation',
				menuId
			) as NavigationMenuRecord | undefined;
			return !! record?.meta?.[ META_KEY ];
		},
		[ menuId ]
	);
	const { editEntityRecord } = useDispatch( coreStore );

	const setEnabled = ( value: boolean ) => {
		editEntityRecord( 'postType', 'wp_navigation', menuId, {
			meta: { [ META_KEY ]: value },
		} );
	};

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
