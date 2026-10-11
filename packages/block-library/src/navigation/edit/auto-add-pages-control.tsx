import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Notice, Stack, SwitchControl } from '@wordpress/ui';

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
 * It belongs to the Navigation Menu rather than to the block, and it is saved
 * the moment it changes, on its own, so it never shows up as a pending change
 * in the editor's save flow.
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
			const record = select( coreStore ).getEntityRecord(
				'postType',
				'wp_navigation',
				menuId
			) as NavigationMenuRecord | undefined;
			return !! record?.meta?.[ META_KEY ];
		},
		[ menuId ]
	);
	const [ isSaving, setIsSaving ] = useState( false );
	const [ hasError, setHasError ] = useState( false );
	const { saveEntityRecord } = useDispatch( coreStore );

	const setEnabled = async ( value: boolean ) => {
		setIsSaving( true );
		setHasError( false );
		try {
			await saveEntityRecord(
				'postType',
				'wp_navigation',
				{ id: menuId, meta: { [ META_KEY ]: value } },
				{ throwOnError: true }
			);
		} catch {
			setHasError( true );
		}
		setIsSaving( false );
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
				<Stack direction="column" gap="sm" align="start">
					<SwitchControl
						label={ __( 'Auto add pages' ) }
						description={ __(
							'Add a link to each new top-level page when it is published.'
						) }
						checked={ isEnabled }
						disabled={ isSaving }
						onCheckedChange={ setEnabled }
					/>
					{ hasError && (
						<Notice.Root intent="error">
							<Notice.Description>
								{ __(
									'The setting could not be saved. Try again.'
								) }
							</Notice.Description>
						</Notice.Root>
					) }
				</Stack>
			</ToolsPanelItem>
		</ToolsPanel>
	);
}
