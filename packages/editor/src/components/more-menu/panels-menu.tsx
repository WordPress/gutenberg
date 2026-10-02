import { __, isRTL } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
// @ts-expect-error `@wordpress/block-editor` does not expose type declarations for its entry point.
import { store as blockEditorStore } from '@wordpress/block-editor';
import { ActionItem, store as interfaceStore } from '@wordpress/interface';
import { drawerLeft, drawerRight } from '@wordpress/icons';
import { store as preferencesStore } from '@wordpress/preferences';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Menu } from '@wordpress/ui';
import MoreMenuItem from './more-menu-item';
import MoreMenuSubmenu, { toMenuItems } from './more-menu-submenu';
import { sidebars } from '../sidebar/constants';

export default function PanelsMenu() {
	const { activeArea, isInspectorOpen, inspectorTab, isDistractionFree } =
		useSelect( ( select ) => {
			const activeSidebar =
				select( interfaceStore ).getActiveComplementaryArea( 'core' );
			return {
				activeArea: activeSidebar,
				isDistractionFree: select( preferencesStore ).get(
					'core',
					'distractionFree'
				),
				isInspectorOpen:
					activeSidebar === sidebars.document ||
					activeSidebar === sidebars.block,
				inspectorTab: select(
					blockEditorStore
				).getBlockSelectionStart()
					? sidebars.block
					: sidebars.document,
			};
		}, [] );
	const { enableComplementaryArea } = useDispatch( interfaceStore );

	// The slot omits itself when there are no other panels, so Inspector alone
	// does not add a submenu.
	return (
		<ActionItem.Slot
			name="core/plugin-more-menu"
			fillProps={ { as: MoreMenuItem } }
		>
			{ ( items ) => (
				<MoreMenuSubmenu label={ __( 'Panels' ) }>
					<Menu.RadioGroup
						value={
							isInspectorOpen
								? sidebars.document
								: ( activeArea ?? null )
						}
					>
						{ ! isDistractionFree && (
							<Menu.RadioItem
								value={ sidebars.document }
								closeOnClick
								prefix={
									<Menu.PrefixIcon
										icon={
											isRTL() ? drawerLeft : drawerRight
										}
									/>
								}
								onClick={ () => {
									if ( ! isInspectorOpen ) {
										enableComplementaryArea(
											'core',
											inspectorTab
										);
									}
								} }
							>
								<Menu.ItemLabel>
									{ __( 'Inspector' ) }
								</Menu.ItemLabel>
							</Menu.RadioItem>
						) }
						{ toMenuItems( items, { radioGroup: true } ) }
					</Menu.RadioGroup>
				</MoreMenuSubmenu>
			) }
		</ActionItem.Slot>
	);
}
