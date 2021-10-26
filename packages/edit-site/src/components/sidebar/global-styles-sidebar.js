/**
 * WordPress dependencies
 */
import { DropdownMenu, FlexItem, FlexBlock, Flex } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { styles, moreVertical } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import DefaultSidebar from './default-sidebar';
import { GlobalStylesUI, useGlobalStylesReset } from '../global-styles';

export default function GlobalStylesSidebar() {
	const [ canReset, onReset ] = useGlobalStylesReset();

	return (
		<DefaultSidebar
			className="edit-site-global-styles-sidebar"
			identifier="edit-site/global-styles"
			title={ __( 'Styles' ) }
			icon={ styles }
			closeLabel={ __( 'Close global styles sidebar' ) }
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
