/**
 * WordPress dependencies
 */
import { createSlotFill, PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { cog, typography } from '@wordpress/icons';
import { useSelect } from '@wordpress/data';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import DefaultSidebar from './default-sidebar';
import GlobalStylesSidebar from './global-styles-sidebar';
import { STORE_NAME } from '../../store/constants';
import SettingsHeader from './header';
import TemplateCard from './template-card';
import { SIDEBAR_BLOCK, SIDEBAR_TEMPLATE } from './constants';

const { Slot: InspectorSlot, Fill: InspectorFill } = createSlotFill(
	'EditSiteSidebarInspector'
);
export const SidebarInspectorFill = InspectorFill;

export function SidebarComplementaryAreaFills() {
	const { sidebarName } = useSelect( ( select ) => {
		let sidebar = select( interfaceStore ).getActiveComplementaryArea(
			STORE_NAME
		);

		if ( ! [ SIDEBAR_BLOCK, SIDEBAR_TEMPLATE ].includes( sidebar ) ) {
			sidebar = SIDEBAR_TEMPLATE;
			if ( select( 'core/block-editor' ).getBlockSelectionStart() ) {
				sidebar = SIDEBAR_BLOCK;
			}
		}

		return {
			sidebarName: sidebar,
		};
	} );

	return (
		<>
			<DefaultSidebar
				identifier={ sidebarName }
				title={ __( 'Block Inspector' ) }
				icon={ cog }
				closeLabel={ __( 'Close block inspector sidebar' ) }
				header={ <SettingsHeader sidebarName={ sidebarName } /> }
				headerClassName="edit-site-sidebar__panel-tabs"
			>
				{ sidebarName === SIDEBAR_TEMPLATE && (
					<PanelBody>
						<TemplateCard />
					</PanelBody>
				) }
				{ sidebarName === SIDEBAR_BLOCK && (
					<InspectorSlot bubblesVirtually />
				) }
			</DefaultSidebar>
			<GlobalStylesSidebar
				identifier="edit-site/global-styles"
				title={ __( 'Global Styles' ) }
				closeLabel={ __( 'Close global styles sidebar' ) }
				icon={ typography }
			/>
		</>
	);
}
