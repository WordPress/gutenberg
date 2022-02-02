/**
 * WordPress dependencies
 */
import { DropdownMenu, FlexItem, FlexBlock, Flex } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { styles, moreVertical } from '@wordpress/icons';
import { useDispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import DefaultSidebar from '../sidebar/default-sidebar';
import { GlobalStylesUI, useGlobalStylesReset } from '../global-styles';

export default function GlobalStylesSidebar() {
	const [ canReset, onReset ] = useGlobalStylesReset();
	const { toggle } = useDispatch( preferencesStore );

	return (
		<DefaultSidebar
			className="edit-site-global-styles-sidebar"
			scope="core/edit-global"
			identifier="edit-global/global-styles"
			title={ __( 'Styles' ) }
			icon={ styles }
			closeLabel={ __( 'Close global styles sidebar' ) }
			panelClassName="edit-site-global-styles-sidebar__panel"
			header={
				<Flex>
					<FlexBlock>
						<strong>{ __( 'Styles' ) }</strong>
						<span className="edit-site-global-styles-sidebar__beta">
							{ __( 'Beta' ) }
						</span>
					</FlexBlock>
					<FlexItem>
						<DropdownMenu
							icon={ moreVertical }
							label={ __( 'More Global Styles Actions' ) }
							toggleProps={ { disabled: ! canReset } }
							controls={ [
								{
									title: __( 'Reset to defaults' ),
									onClick: onReset,
								},
								{
									title: __( 'Welcome Guide' ),
									onClick: () =>
										toggle(
											'core/edit-site',
											'welcomeGuideStyles'
										),
								},
							] }
						/>
					</FlexItem>
				</Flex>
			}
		>
			<GlobalStylesUI />
		</DefaultSidebar>
	);
}
