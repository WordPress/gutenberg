/**
 * WordPress dependencies
 */
import { DropdownMenu, FlexItem, FlexBlock, Flex } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { styles, moreVertical } from '@wordpress/icons';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import DefaultSidebar from './default-sidebar';
import { GlobalStylesUI, useGlobalStylesReset } from '../global-styles';
import { store as editSiteStore } from '../../store';

export default function GlobalStylesSidebar() {
	const [ canReset, onReset ] = useGlobalStylesReset();
	const { toggleFeature } = useDispatch( editSiteStore );

	return (
		<DefaultSidebar
			className="edit-site-global-styles-sidebar"
			identifier="edit-site/global-styles"
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
										toggleFeature( 'welcomeGuideStyles' ),
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
