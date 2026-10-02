import { __, isRTL } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
// @ts-expect-error `@wordpress/block-editor` does not expose type declarations for its entry point.
import { store as blockEditorStore } from '@wordpress/block-editor';
import { ActionItem, store as interfaceStore } from '@wordpress/interface';
import { drawerLeft, drawerRight } from '@wordpress/icons';
import { store as preferencesStore } from '@wordpress/preferences';
import MoreMenuItem from './more-menu-item';
import MoreMenuSubmenu, { toMenuItems } from './more-menu-submenu';
import { sidebars } from '../sidebar/constants';

export default function PanelsMenu() {
	const { isInspectorOpen, inspectorTab, isDistractionFree } = useSelect(
		( select ) => {
			const activeArea =
				select( interfaceStore ).getActiveComplementaryArea( 'core' );
			return {
				isDistractionFree: select( preferencesStore ).get(
					'core',
					'distractionFree'
				),
				isInspectorOpen:
					activeArea === sidebars.document ||
					activeArea === sidebars.block,
				inspectorTab: select(
					blockEditorStore
				).getBlockSelectionStart()
					? sidebars.block
					: sidebars.document,
			};
		},
		[]
	);
	const { enableComplementaryArea, disableComplementaryArea } =
		useDispatch( interfaceStore );

	// The slot omits itself when there are no other panels, so Inspector alone
	// does not add a submenu.
	return (
		<ActionItem.Slot
			name="core/plugin-more-menu"
			fillProps={ { as: MoreMenuItem } }
		>
			{ ( items ) => (
				<MoreMenuSubmenu label={ __( 'Panels' ) }>
					{ ! isDistractionFree && (
						<MoreMenuItem
							role="menuitemcheckbox"
							aria-checked={ isInspectorOpen }
							icon={ isRTL() ? drawerLeft : drawerRight }
							onClick={ () => {
								if ( isInspectorOpen ) {
									disableComplementaryArea( 'core' );
								} else {
									enableComplementaryArea(
										'core',
										inspectorTab
									);
								}
							} }
						>
							{ __( 'Inspector' ) }
						</MoreMenuItem>
					) }
					{ toMenuItems( items ) }
				</MoreMenuSubmenu>
			) }
		</ActionItem.Slot>
	);
}
